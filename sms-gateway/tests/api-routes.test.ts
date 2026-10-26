import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { DatabaseManager } from '../src/db/database.ts';
import { AdbClient } from '../src/device/adb-client.ts';
import { TelegramNotifier } from '../src/telegram/telegram-notifier.ts';
import { HealthMonitor } from '../src/health/health-monitor.ts';
import { SmsPoller } from '../src/device/sms-poller.ts';
import { ApiRouter } from '../src/api/routes.ts';
import { HttpServer } from '../src/api/server.ts';

describe('Интеграционные тесты REST API (api-routes)', () => {
  let db: DatabaseManager;
  let adbClient: AdbClient;
  let notifier: TelegramNotifier;
  let healthMonitor: HealthMonitor;
  let poller: SmsPoller;
  let router: ApiRouter;
  let server: HttpServer;
  const testPort = 3099;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  before(async () => {
    // Инициализируем тестовые зависимости
    db = new DatabaseManager(':memory:');
    adbClient = new AdbClient('non_existent_adb_binary');
    notifier = new TelegramNotifier('', [], false);
    healthMonitor = new HealthMonitor(adbClient, db, notifier, 60000);
    poller = new SmsPoller(adbClient, db, notifier, healthMonitor, 5000);
    router = new ApiRouter(db, healthMonitor, poller, notifier);
    server = new HttpServer(testPort, router);

    await server.start();
  });

  after(async () => {
    await server.stop();
    db.close();
  });

  it('GET /health возвращает структурированный статус системы', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = (await res.json()) as any;

    // В тестах без реального телефона статус warning или error
    assert.ok(data.status === 'ok' || data.status === 'warning' || data.status === 'error');
    assert.strictEqual(data.service, 'sms-gateway');
    assert.ok(typeof data.message === 'string');
    assert.ok(data.device !== undefined);
    assert.ok(data.stats !== undefined);
  });

  it('GET /sms/latest возвращает 404 при отсутствии сообщений', async () => {
    const res = await fetch(`${baseUrl}/sms/latest`);
    const data = (await res.json()) as any;

    assert.strictEqual(res.status, 404);
    assert.strictEqual(data.status, 'error');
  });

  it('POST /sms/webhook успешно принимает новое SMS и оно доступно в GET /sms/latest', async () => {
    const payload = {
      sender: 'CaixaBank',
      body: 'Terminal 450 EUR completado. Codigo: 123456',
      receivedAt: Date.now(),
    };

    const postRes = await fetch(`${baseUrl}/sms/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const postData = (await postRes.json()) as any;

    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postData.status, 'ok');
    assert.strictEqual(postData.data.sender, 'CaixaBank');

    // Проверяем, что теперь GET /sms/latest возвращает это сообщение
    const getRes = await fetch(`${baseUrl}/sms/latest`);
    const getData = (await getRes.json()) as any;

    assert.strictEqual(getRes.status, 200);
    assert.strictEqual(getData.status, 'ok');
    assert.strictEqual(getData.data.sender, 'CaixaBank');
    assert.ok(getData.data.body.includes('Terminal 450 EUR'));
  });

  it('POST /sms/webhook корректно обрабатывает вложенный формат event sms:received от SMS Gateway', async () => {
    const payload = {
      event: 'sms:received',
      payload: {
        messageId: 'msg_98765',
        message: 'BBVA: Ingreso en cajero 500,00 EUR. Codigo: 778899',
        phoneNumber: 'BBVA',
        simNumber: 2,
        receivedAt: '2026-10-26T14:15:00.000+01:00',
      },
    };

    const postRes = await fetch(`${baseUrl}/sms/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const postData = (await postRes.json()) as any;

    assert.strictEqual(postRes.status, 200);
    assert.strictEqual(postData.status, 'ok');
    assert.strictEqual(postData.data.sender, 'BBVA');
    assert.strictEqual(postData.data.androidId, 'msg_98765');
    assert.ok(postData.data.body.includes('500,00 EUR'));
  });

  it('GET /sms/list возвращает массив сообщений и метаданные пагинации', async () => {
    const res = await fetch(`${baseUrl}/sms/list?limit=10&offset=0`);
    const data = (await res.json()) as any;

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(Array.isArray(data.data.items));
    assert.ok(data.data.pagination.total >= 1);
    assert.strictEqual(data.data.pagination.limit, 10);
  });

  it('GET /sms/:id возвращает конкретное сообщение', async () => {
    const latestRes = await fetch(`${baseUrl}/sms/latest`);
    const latestData = (await latestRes.json()) as any;
    const smsId = latestData.data.id;

    const res = await fetch(`${baseUrl}/sms/${smsId}`);
    const data = (await res.json()) as any;

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.data.id, smsId);
  });

  it('POST /sms/sync инициирует синхронизацию и возвращает счетчики', async () => {
    const res = await fetch(`${baseUrl}/sms/sync`, { method: 'POST' });
    const data = (await res.json()) as any;

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'ok');
    assert.ok(data.data.fetched !== undefined);
  });

  it('Возвращает 404 на неизвестные маршруты со списком доступных эндпоинтов', async () => {
    const res = await fetch(`${baseUrl}/unknown-endpoint`);
    const data = (await res.json()) as any;

    assert.strictEqual(res.status, 404);
    assert.strictEqual(data.status, 'error');
    assert.ok(Array.isArray(data.availableEndpoints));
  });
});

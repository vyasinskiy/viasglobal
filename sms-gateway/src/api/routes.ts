import { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { DatabaseManager, type SmsRecord } from '../db/database.ts';
import { HealthMonitor } from '../health/health-monitor.ts';
import { SmsPoller } from '../device/sms-poller.ts';
import { TelegramNotifier } from '../telegram/telegram-notifier.ts';

/**
 * Вспомогательная функция для отправки JSON-ответа с установкой CORS и заголовков.
 */
export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  const jsonString = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
  });
  res.end(jsonString);
}

/**
 * Чтение и парсинг тела входящего HTTP-запроса (JSON).
 */
export async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Ограничиваем размер тела запроса 1 МБ
      if (body.length > 1024 * 1024) {
        reject(new Error('Размер тела запроса превышает допустимый лимит (1MB)'));
      }
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Некорректный JSON в теле запроса: ${err.message}`));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

/**
 * Класс маршрутизатора REST API для сервиса SMS Gateway.
 */
export class ApiRouter {
  private db: DatabaseManager;
  private healthMonitor: HealthMonitor;
  private poller: SmsPoller;
  private notifier: TelegramNotifier;

  constructor(
    db: DatabaseManager,
    healthMonitor: HealthMonitor,
    poller: SmsPoller,
    notifier: TelegramNotifier
  ) {
    this.db = db;
    this.healthMonitor = healthMonitor;
    this.poller = poller;
    this.notifier = notifier;
  }

  /**
   * Главный обработчик входящих HTTP-запросов.
   */
  public async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = req.method || 'GET';
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Обработка CORS pre-flight запросов
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });
      res.end();
      return;
    }

    try {
      // 1. GET /health - Комплексная проверка здоровья сервиса и подключенного телефона
      if (method === 'GET' && pathname === '/health') {
        const health = this.healthMonitor.getCurrentHealth();
        const statusCode = health.status === 'ok' ? 200 : health.status === 'warning' ? 200 : 503;
        sendJson(res, statusCode, health);
        return;
      }

      // 2. GET /sms/latest - Получить самое свежее входящее сообщение
      if (method === 'GET' && pathname === '/sms/latest') {
        const latest = this.db.getLatestSms();
        if (!latest) {
          sendJson(res, 404, {
            status: 'error',
            message: 'В базе данных пока нет входящих SMS сообщений',
            data: null,
          });
          return;
        }

        sendJson(res, 200, {
          status: 'ok',
          message: 'Последнее входящее SMS успешно получено',
          data: latest,
        });
        return;
      }

      // 3. GET /sms/list - Список SMS с пагинацией и поиском
      if (method === 'GET' && pathname === '/sms/list') {
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '20', 10);
        const offset = parseInt(parsedUrl.searchParams.get('offset') || '0', 10);
        const sender = parsedUrl.searchParams.get('sender') || undefined;
        const search = parsedUrl.searchParams.get('search') || undefined;
        const sinceRaw = parsedUrl.searchParams.get('since');
        const since = sinceRaw ? parseInt(sinceRaw, 10) : undefined;

        const { items, total } = this.db.getSmsList({ limit, offset, sender, search, since });

        sendJson(res, 200, {
          status: 'ok',
          message: `Найдено ${items.length} из ${total} сообщений`,
          data: {
            items,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + items.length < total,
            },
          },
        });
        return;
      }

      // 4. GET /sms/:id - Получить конкретное сообщение по числовому ID
      const smsIdMatch = pathname.match(/^\/sms\/(\d+)$/);
      if (method === 'GET' && smsIdMatch) {
        const id = parseInt(smsIdMatch[1], 10);
        const sms = this.db.getSmsById(id);

        if (!sms) {
          sendJson(res, 404, {
            status: 'error',
            message: `SMS с идентификатором #${id} не найдено`,
            data: null,
          });
          return;
        }

        sendJson(res, 200, {
          status: 'ok',
          message: `SMS #${id} успешно найдено`,
          data: sms,
        });
        return;
      }

      // 5. POST /sms/sync - Принудительный опрос устройства через ADB
      if (method === 'POST' && pathname === '/sms/sync') {
        const syncResult = await this.poller.syncNow();
        sendJson(res, 200, {
          status: 'ok',
          message: `Синхронизация завершена. Прочитано: ${syncResult.fetched}, новых сообщений: ${syncResult.newCount}`,
          data: syncResult,
        });
        return;
      }

      // 6. POST /sms/webhook - Прием входящих SMS от Android-приложений (SMS Forwarder / SMS Gate)
      if (method === 'POST' && pathname === '/sms/webhook') {
        const body = await parseJsonBody(req);

        // Обработка системного ping (heartbeat)
        if (body.event === 'system:ping') {
          sendJson(res, 200, { status: 'ok', message: 'Heartbeat ping успешно принят' });
          return;
        }

        let sender = body.sender || body.from || body.address;
        let text = body.body || body.message || body.text;
        let receivedAt = body.receivedAt || body.timestamp || Date.now();
        let androidId = body.androidId;

        // Если пришел формат события sms:received от capcom6/android-sms-gateway
        if (body.event === 'sms:received' && body.payload) {
          sender = body.payload.phoneNumber || body.payload.sender || sender;
          text = body.payload.message || body.payload.text || text;
          if (body.payload.receivedAt) {
            receivedAt = new Date(body.payload.receivedAt).getTime();
          }
          androidId = body.payload.messageId || androidId;
        }

        if (!sender || !text) {
          sendJson(res, 400, {
            status: 'error',
            message: 'Некорректные параметры: поля sender и body обязательны',
            errors: ['sender is required', 'body is required'],
          });
          return;
        }

        const smsRecord: SmsRecord = {
          androidId: androidId || `webhook_${Date.now()}`,
          sender: String(sender).trim(),
          body: String(text).trim(),
          receivedAt: Number(receivedAt),
          rawData: JSON.stringify(body),
        };

        const { record, isNew } = this.db.saveSms(smsRecord);

        if (isNew) {
          const currentHealth = this.healthMonitor.getCurrentHealth();
          const batteryInfo = currentHealth.device.battery.level !== null ? {
            level: currentHealth.device.battery.level,
            isCharging: currentHealth.device.battery.isCharging ?? false,
          } as any : null;

          const sendResult = await this.notifier.sendSmsNotification(
            record,
            batteryInfo,
            currentHealth.device.model || 'Android Phone'
          );

          if (sendResult.success && record.id) {
            this.db.markTelegramSent(record.id, sendResult.messageId);
          }
        }

        sendJson(res, 200, {
          status: 'ok',
          message: isNew ? 'Новое SMS успешно принято и отправлено в Telegram' : 'SMS уже было сохранено ранее',
          data: record,
        });
        return;
      }

      // 7. POST /health/alert - Тестовая отправка статуса или произвольного сообщения в Telegram
      if (method === 'POST' && pathname === '/health/alert') {
        const health = await this.healthMonitor.checkHealth();
        const stats = this.db.getStats();
        const success = await this.notifier.sendHealthReport(health, stats.totalSms);

        sendJson(res, 200, {
          status: success ? 'ok' : 'error',
          message: success ? 'Отчет о здоровье успешно отправлен в Telegram' : 'Не удалось отправить отчет в Telegram',
          data: { health, stats },
        });
        return;
      }

      // Маршрут не найден (404)
      sendJson(res, 404, {
        status: 'error',
        message: `Маршрут ${method} ${pathname} не найден`,
        availableEndpoints: [
          'GET /health',
          'GET /sms/latest',
          'GET /sms/list',
          'GET /sms/:id',
          'POST /sms/sync',
          'POST /sms/webhook',
          'POST /health/alert',
        ],
      });
    } catch (err: any) {
      console.error(`[ApiRouter] Внутренняя ошибка обработки запроса ${method} ${pathname}:`, err);
      sendJson(res, 500, {
        status: 'error',
        message: 'Внутренняя ошибка сервера SMS Gateway',
        error: err.message || String(err),
      });
    }
  }
}

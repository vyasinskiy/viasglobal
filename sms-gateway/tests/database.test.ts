import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DatabaseManager, type SmsRecord, type HealthLogRecord } from '../src/db/database.ts';

describe('Модуль базы данных SQLite (database)', () => {
  let db: DatabaseManager;

  beforeEach(() => {
    // Для каждого теста создаем чистую базу данных в оперативной памяти
    db = new DatabaseManager(':memory:');
  });

  describe('Сохранение и дедупликация SMS сообщений', () => {
    it('Успешно сохраняет новое входящее SMS сообщение', () => {
      const sms: SmsRecord = {
        androidId: '101',
        sender: 'CaixaBank',
        body: 'Operacion terminal 450,00 EUR',
        receivedAt: 1730005000000,
      };

      const result = db.saveSms(sms);

      // Проверяем флаг новизны и присвоенный ID
      assert.strictEqual(result.isNew, true);
      assert.ok(result.record.id! > 0);
      assert.strictEqual(result.record.sender, 'CaixaBank');
      assert.strictEqual(result.record.body, 'Operacion terminal 450,00 EUR');
    });

    it('Предотвращает повторную вставку дубликата SMS по androidId', () => {
      const sms: SmsRecord = {
        androidId: '102',
        sender: 'BBVA',
        body: 'Codigo 8492',
        receivedAt: 1730006000000,
      };

      // Первое сохранение
      const first = db.saveSms(sms);
      assert.strictEqual(first.isNew, true);

      // Повторная попытка сохранить то же самое сообщение
      const second = db.saveSms(sms);
      assert.strictEqual(second.isNew, false);
      assert.strictEqual(second.record.id, first.record.id);

      // В базе должна остаться ровно 1 запись
      const stats = db.getStats();
      assert.strictEqual(stats.totalSms, 1);
    });

    it('Предотвращает дубликат по паре (sender, receivedAt) даже без androidId', () => {
      const sms1: SmsRecord = {
        sender: '+34600112233',
        body: 'Текст 1',
        receivedAt: 1730007000000,
      };
      const sms2: SmsRecord = {
        sender: '+34600112233',
        body: 'Текст 1',
        receivedAt: 1730007000000,
      };

      const res1 = db.saveSms(sms1);
      const res2 = db.saveSms(sms2);

      assert.strictEqual(res1.isNew, true);
      assert.strictEqual(res2.isNew, false);
    });
  });

  describe('Выборка и фильтрация сообщений', () => {
    it('getLatestSms возвращает самое последнее по времени сообщение', () => {
      db.saveSms({
        androidId: '1',
        sender: 'Bank',
        body: 'Старое сообщение',
        receivedAt: 1000,
      });
      db.saveSms({
        androidId: '2',
        sender: 'Bank',
        body: 'Свежее сообщение',
        receivedAt: 5000,
      });
      db.saveSms({
        androidId: '3',
        sender: 'Bank',
        body: 'Среднее сообщение',
        receivedAt: 3000,
      });

      const latest = db.getLatestSms();
      assert.ok(latest);
      assert.strictEqual(latest.androidId, '2');
      assert.strictEqual(latest.body, 'Свежее сообщение');
    });

    it('getSmsList корректно фильтрует по отправителю и тексту', () => {
      db.saveSms({ androidId: '1', sender: 'CaixaBank', body: 'Терминал 450 EUR', receivedAt: 1000 });
      db.saveSms({ androidId: '2', sender: 'BBVA', body: 'Код доступа 1234', receivedAt: 2000 });
      db.saveSms({ androidId: '3', sender: 'CaixaBank', body: 'Терминал 500 EUR', receivedAt: 3000 });

      // Поиск только сообщений от CaixaBank
      const caixaOnly = db.getSmsList({ sender: 'Caixa' });
      assert.strictEqual(caixaOnly.total, 2);
      assert.strictEqual(caixaOnly.items.length, 2);

      // Поиск по ключевому слову 'Код'
      const codeOnly = db.getSmsList({ search: 'Код' });
      assert.strictEqual(codeOnly.total, 1);
      assert.strictEqual(codeOnly.items[0].sender, 'BBVA');
    });

    it('markTelegramSent корректно проставляет время и messageId', () => {
      const { record } = db.saveSms({
        androidId: '10',
        sender: 'Bank',
        body: 'Тест',
        receivedAt: 1000,
      });

      assert.strictEqual(record.telegramSentAt, null);

      db.markTelegramSent(record.id!, 999888);

      const updated = db.getSmsById(record.id!);
      assert.ok(updated);
      assert.ok(updated.telegramSentAt! > 0);
      assert.strictEqual(updated.telegramMessageId, 999888);
    });
  });

  describe('Управление снимками состояния здоровья (Health Logs)', () => {
    it('Успешно сохраняет и извлекает снимок состояния устройства', () => {
      const log: HealthLogRecord = {
        isConnected: true,
        batteryLevel: 85,
        isCharging: true,
        temperature: 28.5,
        simState: 'READY',
        operator: 'DIGI mobil',
        status: 'ok',
        checkedAt: 1730008000000,
      };

      db.saveHealthLog(log);

      const latestLog = db.getLatestHealthLog();
      assert.ok(latestLog);
      assert.strictEqual(latestLog.isConnected, true);
      assert.strictEqual(latestLog.batteryLevel, 85);
      assert.strictEqual(latestLog.isCharging, true);
      assert.strictEqual(latestLog.temperature, 28.5);
      assert.strictEqual(latestLog.operator, 'DIGI mobil');
      assert.strictEqual(latestLog.status, 'ok');
    });
  });
});

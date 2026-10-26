import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Интерфейс записи SMS сообщения в базе данных.
 */
export interface SmsRecord {
  /** Уникальный внутренний идентификатор записи */
  id?: number;
  /** Идентификатор SMS из Android системы (поле _id в content://sms) */
  androidId?: string | null;
  /** Номер телефона или буквенное имя отправителя (например, CaixaBank) */
  sender: string;
  /** Текст сообщения */
  body: string;
  /** Время получения сообщения на телефоне (Unix timestamp в миллисекундах) */
  receivedAt: number;
  /** Время отправки уведомления в Telegram (Unix timestamp в миллисекундах) */
  telegramSentAt?: number | null;
  /** ID сообщения в Telegram */
  telegramMessageId?: number | null;
  /** Исходные сырые данные (если есть) */
  rawData?: string | null;
  /** Время создания записи в локальной БД */
  createdAt?: number;
}

/**
 * Интерфейс записи снимка состояния устройства (Health Log).
 */
export interface HealthLogRecord {
  /** Идентификатор записи */
  id?: number;
  /** Флаг подключения устройства по USB (1 - подключен, 0 - отключен) */
  isConnected: boolean;
  /** Уровень заряда батареи (0 - 100%) */
  batteryLevel?: number | null;
  /** Флаг зарядки батареи */
  isCharging?: boolean | null;
  /** Температура батареи (в градусах Цельсия) */
  temperature?: number | null;
  /** Состояние SIM-карты (READY, ABSENT и т.д.) */
  simState?: string | null;
  /** Название оператора связи (например, DIGI mobil, Movistar) */
  operator?: string | null;
  /** Общий статус (ok, warning, error) */
  status: string;
  /** Время выполнения проверки */
  checkedAt: number;
}

/**
 * Класс управления базой данных SQLite для SMS Gateway.
 */
export class DatabaseManager {
  private db: DatabaseSync;

  /**
   * Конструктор: инициализирует базу данных по указанному пути.
   * Если путь равен ':memory:', база создается в оперативной памяти (для тестов).
   */
  constructor(dbPath: string = './data/sms.db') {
    // Если путь не in-memory, убеждаемся в наличии родительской директории
    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Создаем синхронное подключение к базе данных SQLite
    this.db = new DatabaseSync(dbPath);

    // Применяем настройки производительности и надежности (WAL-режим)
    if (dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
    this.db.exec('PRAGMA foreign_keys = ON;');

    // Инициализируем необходимые таблицы и индексы
    this.initTables();
  }

  /**
   * Создание таблиц схемы базы данных, если они еще не существуют.
   */
  private initTables(): void {
    // Таблица для хранения SMS сообщений
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        android_id TEXT,
        sender TEXT NOT NULL,
        body TEXT NOT NULL,
        received_at INTEGER NOT NULL,
        telegram_sent_at INTEGER,
        telegram_message_id INTEGER,
        raw_data TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    // Индекс для быстрого поиска по времени получения
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sms_received_at ON sms(received_at DESC);
    `);

    // Уникальный составной индекс для предотвращения дублирования SMS по android_id или (sender, received_at)
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sms_sender_received ON sms(sender, received_at);
    `);

    // Таблица для истории мониторинга здоровья устройства (Health Checks)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS health_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_connected INTEGER NOT NULL,
        battery_level INTEGER,
        is_charging INTEGER,
        temperature REAL,
        sim_state TEXT,
        operator TEXT,
        status TEXT NOT NULL,
        checked_at INTEGER NOT NULL
      );
    `);

    // Индекс для выборки последних проверок здоровья
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_health_checked_at ON health_logs(checked_at DESC);
    `);

    // Таблица настроек и служебных метаданных (Key-Value)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  /**
   * Сохранение входящего SMS сообщения.
   * Если такое сообщение уже было получено (проверяется по sender и received_at, либо android_id),
   * дубликат не создается, а возвращается существующая запись.
   */
  public saveSms(sms: SmsRecord): { record: SmsRecord; isNew: boolean } {
    const now = Date.now();
    const receivedAt = sms.receivedAt || now;

    // Сначала проверяем, нет ли уже такого SMS в базе
    let existingQuery: string;
    let params: (string | number)[];

    if (sms.androidId) {
      existingQuery = `SELECT * FROM sms WHERE android_id = ? LIMIT 1`;
      params = [sms.androidId];
    } else {
      existingQuery = `SELECT * FROM sms WHERE sender = ? AND received_at = ? LIMIT 1`;
      params = [sms.sender, receivedAt];
    }

    const checkStmt = this.db.prepare(existingQuery);
    const existing = checkStmt.get(...params) as any;

    if (existing) {
      // Сообщение уже существует, возвращаем его
      return {
        record: this.mapRowToSms(existing),
        isNew: false,
      };
    }

    // Сохраняем новую запись
    const insertStmt = this.db.prepare(`
      INSERT INTO sms (
        android_id, sender, body, received_at, telegram_sent_at,
        telegram_message_id, raw_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      sms.androidId || null,
      sms.sender,
      sms.body,
      receivedAt,
      sms.telegramSentAt || null,
      sms.telegramMessageId || null,
      sms.rawData || null,
      now
    );

    const newRecord: SmsRecord = {
      id: Number(result.lastInsertRowid),
      androidId: sms.androidId || null,
      sender: sms.sender,
      body: sms.body,
      receivedAt: receivedAt,
      telegramSentAt: sms.telegramSentAt || null,
      telegramMessageId: sms.telegramMessageId || null,
      rawData: sms.rawData || null,
      createdAt: now,
    };

    return {
      record: newRecord,
      isNew: true,
    };
  }

  /**
   * Отметка факта успешной пересылки сообщения в Telegram.
   */
  public markTelegramSent(smsId: number, telegramMessageId?: number): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE sms
      SET telegram_sent_at = ?, telegram_message_id = ?
      WHERE id = ?
    `);
    stmt.run(now, telegramMessageId || null, smsId);
  }

  /**
   * Получить последнее входящее SMS сообщение.
   */
  public getLatestSms(): SmsRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM sms ORDER BY received_at DESC, id DESC LIMIT 1
    `);
    const row = stmt.get() as any;
    return row ? this.mapRowToSms(row) : null;
  }

  /**
   * Получить список SMS сообщений с фильтрацией и пагинацией.
   */
  public getSmsList(options: {
    limit?: number;
    offset?: number;
    sender?: string;
    search?: string;
    since?: number;
  } = {}): { items: SmsRecord[]; total: number } {
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = Math.max(0, options.offset || 0);

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    // Фильтр по отправителю
    if (options.sender) {
      conditions.push(`sender LIKE ?`);
      params.push(`%${options.sender}%`);
    }

    // Поиск по тексту сообщения
    if (options.search) {
      conditions.push(`body LIKE ?`);
      params.push(`%${options.search}%`);
    }

    // Фильтр по минимальному времени
    if (options.since) {
      conditions.push(`received_at >= ?`);
      params.push(options.since);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Подсчет общего количества записей
    const countStmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM sms ${whereClause}`);
    const countRow = countStmt.get(...params) as any;
    const total = Number(countRow?.cnt || 0);

    // Выборка элементов
    const query = `
      SELECT * FROM sms
      ${whereClause}
      ORDER BY received_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;
    const selectStmt = this.db.prepare(query);
    const rows = selectStmt.all(...params, limit, offset) as any[];

    const items = rows.map((r) => this.mapRowToSms(r));

    return { items, total };
  }

  /**
   * Получить SMS по первичному числовому идентификатору.
   */
  public getSmsById(id: number): SmsRecord | null {
    const stmt = this.db.prepare(`SELECT * FROM sms WHERE id = ? LIMIT 1`);
    const row = stmt.get(id) as any;
    return row ? this.mapRowToSms(row) : null;
  }

  /**
   * Сохранить запись проверки здоровья (Health Log).
   */
  public saveHealthLog(log: HealthLogRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO health_logs (
        is_connected, battery_level, is_charging, temperature,
        sim_state, operator, status, checked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.isConnected ? 1 : 0,
      log.batteryLevel !== undefined ? log.batteryLevel : null,
      log.isCharging !== undefined ? (log.isCharging ? 1 : 0) : null,
      log.temperature !== undefined ? log.temperature : null,
      log.simState || null,
      log.operator || null,
      log.status,
      log.checkedAt
    );
  }

  /**
   * Получить последний сохраненный снимок здоровья устройства.
   */
  public getLatestHealthLog(): HealthLogRecord | null {
    const stmt = this.db.prepare(`
      SELECT * FROM health_logs ORDER BY checked_at DESC, id DESC LIMIT 1
    `);
    const row = stmt.get() as any;
    if (!row) return null;

    return {
      id: Number(row.id),
      isConnected: row.is_connected === 1,
      batteryLevel: row.battery_level !== null ? Number(row.battery_level) : null,
      isCharging: row.is_charging !== null ? row.is_charging === 1 : null,
      temperature: row.temperature !== null ? Number(row.temperature) : null,
      simState: row.sim_state,
      operator: row.operator,
      status: row.status,
      checkedAt: Number(row.checked_at),
    };
  }

  /**
   * Получить сводную статистику по сервису.
   */
  public getStats(): { totalSms: number; lastSmsTimestamp: number | null } {
    const countStmt = this.db.prepare(`SELECT COUNT(*) as cnt FROM sms`);
    const countRow = countStmt.get() as any;

    const latestStmt = this.db.prepare(`SELECT received_at FROM sms ORDER BY received_at DESC LIMIT 1`);
    const latestRow = latestStmt.get() as any;

    return {
      totalSms: Number(countRow?.cnt || 0),
      lastSmsTimestamp: latestRow ? Number(latestRow.received_at) : null,
    };
  }

  /**
   * Получить значение настройки по ключу.
   */
  public getSetting(key: string): string | null {
    const stmt = this.db.prepare(`SELECT value FROM app_settings WHERE key = ? LIMIT 1`);
    const row = stmt.get(key) as any;
    return row ? String(row.value) : null;
  }

  /**
   * Сохранить значение настройки по ключу.
   */
  public setSetting(key: string, value: string): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
    stmt.run(key, value, now);
  }

  /**
   * Преобразование строки базы данных в типизированный объект SmsRecord.
   */
  private mapRowToSms(row: any): SmsRecord {
    return {
      id: Number(row.id),
      androidId: row.android_id ? String(row.android_id) : null,
      sender: String(row.sender),
      body: String(row.body),
      receivedAt: Number(row.received_at),
      telegramSentAt: row.telegram_sent_at !== null ? Number(row.telegram_sent_at) : null,
      telegramMessageId: row.telegram_message_id !== null ? Number(row.telegram_message_id) : null,
      rawData: row.raw_data ? String(row.raw_data) : null,
      createdAt: Number(row.created_at),
    };
  }

  /**
   * Закрытие подключения к базе данных.
   */
  public close(): void {
    this.db.close();
  }
}

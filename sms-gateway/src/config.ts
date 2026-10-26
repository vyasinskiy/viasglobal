import process from 'node:process';

/**
 * Интерфейс полной конфигурации сервиса SMS Gateway.
 */
export interface AppConfig {
  /** Порт внутреннего HTTP-сервера для REST API */
  port: number;
  /** Токен Telegram бота для отправки сообщений */
  telegramBotToken: string;
  /** Список Telegram Chat ID для отправки сообщений */
  telegramChatIds: string[];
  /** Путь к исполняемому файлу adb */
  adbPath: string;
  /** Желаемый серийный номер Android-устройства (если не указан, берется первое доступное) */
  adbDeviceSerial: string;
  /** Интервал опроса входящих SMS (в миллисекундах) */
  pollIntervalMs: number;
  /** Интервал проверки здоровья устройства (в миллисекундах) */
  healthCheckIntervalMs: number;
  /** Порог заряда батареи (в процентах), ниже которого отправляется алерт */
  lowBatteryThreshold: number;
  /** Порог высокого заряда батареи для информации */
  highBatteryThreshold: number;
  /** Путь к файлу локальной базы данных SQLite */
  databasePath: string;
  /** Флаг активности отправки уведомлений в Telegram */
  enableTelegramNotifications: boolean;
  /** Часовой пояс для форматирования времени */
  timezone: string;
}

/**
 * Загрузка и валидация конфигурации сервиса из переменных окружения (process.env).
 * При отсутствии параметров применяются безопасные значения по умолчанию.
 */
export function loadConfig(): AppConfig {
  // Получаем порт сервера, по умолчанию используем 3040
  const port = parseInt(process.env.PORT || '3040', 10);

  // Считываем токен Telegram бота
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';

  // Считываем список Chat ID (поддерживается указание через запятую)
  const rawChatIds = process.env.TELEGRAM_CHAT_ID || '743866013';
  const telegramChatIds = rawChatIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  // Путь к adb: на Linux хосте Huawei проверяем стандартный каталог ~/.local/bin/adb, либо системный PATH
  const adbPath = process.env.ADB_PATH || 'adb';

  // Серийный номер целевого устройства (опционально)
  const adbDeviceSerial = process.env.ADB_DEVICE_SERIAL || '';

  // Интервал поллинга SMS (минимум 1 секунда, по умолчанию 5 секунд)
  const pollIntervalMs = Math.max(1000, parseInt(process.env.POLL_INTERVAL_MS || '5000', 10));

  // Интервал health check (минимум 5 секунд, по умолчанию 60 секунд)
  const healthCheckIntervalMs = Math.max(5000, parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '60000', 10));

  // Порог низкого заряда батареи (по умолчанию 15%)
  const lowBatteryThreshold = parseInt(process.env.LOW_BATTERY_THRESHOLD || '15', 10);

  // Порог высокого заряда батареи (по умолчанию 90%)
  const highBatteryThreshold = parseInt(process.env.HIGH_BATTERY_THRESHOLD || '90', 10);

  // Путь к файлу базы данных SQLite
  const databasePath = process.env.DATABASE_PATH || './data/sms.db';

  // Флаг отправки в Telegram
  const enableTelegramNotifications = process.env.ENABLE_TELEGRAM_NOTIFICATIONS !== 'false';

  // Часовой пояс
  const timezone = process.env.TZ || 'Europe/Madrid';

  return {
    port,
    telegramBotToken,
    telegramChatIds,
    adbPath,
    adbDeviceSerial,
    pollIntervalMs,
    healthCheckIntervalMs,
    lowBatteryThreshold,
    highBatteryThreshold,
    databasePath,
    enableTelegramNotifications,
    timezone,
  };
}

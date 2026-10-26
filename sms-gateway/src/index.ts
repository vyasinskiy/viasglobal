import process from 'node:process';
import { loadConfig } from './config.ts';
import { DatabaseManager } from './db/database.ts';
import { AdbClient } from './device/adb-client.ts';
import { TelegramNotifier } from './telegram/telegram-notifier.ts';
import { HealthMonitor } from './health/health-monitor.ts';
import { SmsPoller } from './device/sms-poller.ts';
import { ApiRouter } from './api/routes.ts';
import { HttpServer } from './api/server.ts';

/**
 * Главная точка входа в сервис SMS Gateway.
 */
async function bootstrap(): Promise<void> {
  console.log('====================================================');
  console.log('📱 Viasglobal SMS Gateway Service запускается...');
  console.log('====================================================');

  // 1. Загрузка параметров конфигурации из переменных окружения
  const config = loadConfig();
  console.log(`[Bootstrap] Конфигурация загружена: порт=${config.port}, chatIds=[${config.telegramChatIds.join(', ')}]`);

  // 2. Инициализация локальной базы данных SQLite
  const db = new DatabaseManager(config.databasePath);
  console.log(`[Bootstrap] Локальная база данных SQLite инициализирована: ${config.databasePath}`);

  // 3. Инициализация клиента ADB
  const adbClient = new AdbClient(config.adbPath, config.adbDeviceSerial);
  const isAdbOk = await adbClient.checkAdbInstalled();
  if (isAdbOk) {
    console.log(`[Bootstrap] ADB доступен по пути: ${config.adbPath}`);
  } else {
    console.warn(`[Bootstrap] ⚠️ Внимание: ADB не найден по пути "${config.adbPath}". Проверьте настройки окружения.`);
  }

  // 4. Инициализация Telegram-нотификатора
  const notifier = new TelegramNotifier(
    config.telegramBotToken,
    config.telegramChatIds,
    config.enableTelegramNotifications,
    config.timezone
  );
  if (config.enableTelegramNotifications && config.telegramBotToken) {
    console.log('[Bootstrap] Telegram-уведомления включены.');
  } else {
    console.warn('[Bootstrap] ⚠️ Telegram-уведомления отключены или не задан TELEGRAM_BOT_TOKEN.');
  }

  // 5. Инициализация модуля мониторинга здоровья (Health Monitor)
  const healthMonitor = new HealthMonitor(
    adbClient,
    db,
    notifier,
    config.healthCheckIntervalMs,
    config.lowBatteryThreshold
  );

  // 6. Инициализация фонового поллера SMS
  const smsPoller = new SmsPoller(
    adbClient,
    db,
    notifier,
    healthMonitor,
    config.pollIntervalMs
  );

  // 7. Инициализация REST API маршрутизатора и HTTP сервера
  const router = new ApiRouter(db, healthMonitor, smsPoller, notifier);
  const httpServer = new HttpServer(config.port, router);

  // 8. Запуск подсистем
  healthMonitor.start();
  smsPoller.start();
  await httpServer.start();

  console.log('====================================================');
  console.log('✅ SMS Gateway успешно инициализирован и работает!');
  console.log(`📡 REST API доступен: http://0.0.0.0:${config.port}`);
  console.log(`🩺 Health check:      http://0.0.0.0:${config.port}/health`);
  console.log(`📩 Последнее SMS:     http://0.0.0.0:${config.port}/sms/latest`);
  console.log('====================================================');

  // 9. Корректная обработка сигналов завершения работы (Graceful Shutdown)
  const shutdown = async (signal: string) => {
    console.log(`\n[Shutdown] Получен сигнал ${signal}. Завершение работы SMS Gateway...`);
    smsPoller.stop();
    healthMonitor.stop();
    await httpServer.stop();
    db.close();
    console.log('[Shutdown] Все ресурсы освобождены. До свидания!');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Запуск приложения
bootstrap().catch((err) => {
  console.error('[Bootstrap] Фатальная ошибка при запуске сервиса:', err);
  process.exit(1);
});

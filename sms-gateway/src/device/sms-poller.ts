import { AdbClient } from './adb-client.ts';
import { DatabaseManager, type SmsRecord } from '../db/database.ts';
import { TelegramNotifier } from '../telegram/telegram-notifier.ts';
import { HealthMonitor } from '../health/health-monitor.ts';

/**
 * Класс фонового поллера входящих SMS сообщений через ADB.
 */
export class SmsPoller {
  private adbClient: AdbClient;
  private db: DatabaseManager;
  private notifier: TelegramNotifier;
  private healthMonitor: HealthMonitor;
  private pollIntervalMs: number;

  private timer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;

  constructor(
    adbClient: AdbClient,
    db: DatabaseManager,
    notifier: TelegramNotifier,
    healthMonitor: HealthMonitor,
    pollIntervalMs: number = 5000
  ) {
    this.adbClient = adbClient;
    this.db = db;
    this.notifier = notifier;
    this.healthMonitor = healthMonitor;
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * Запуск регулярного опроса входящих SMS.
   */
  public start(): void {
    if (this.timer) return;

    // Выполняем первоначальный опрос
    this.pollSms().catch((err) => {
      console.error(`[SmsPoller] Ошибка при стартовом опросе: ${err.message}`);
    });

    // Запускаем таймер с заданным интервалом
    this.timer = setInterval(() => {
      this.pollSms().catch((err) => {
        console.error(`[SmsPoller] Ошибка при фоновом опросе: ${err.message}`);
      });
    }, this.pollIntervalMs);

    console.log(`[SmsPoller] Поллер SMS запущен с интервалом ${this.pollIntervalMs / 1000} сек`);
  }

  /**
   * Остановка поллера.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Принудительная синхронизация входящих сообщений (например, по вызову POST /sms/sync).
   */
  public async syncNow(): Promise<{ fetched: number; newCount: number; newMessages: SmsRecord[] }> {
    return this.pollSms();
  }

  /**
   * Одна итерация проверки и сохранения входящих SMS.
   */
  private async pollSms(): Promise<{ fetched: number; newCount: number; newMessages: SmsRecord[] }> {
    if (this.isPolling) {
      return { fetched: 0, newCount: 0, newMessages: [] };
    }

    this.isPolling = true;
    const newMessages: SmsRecord[] = [];

    try {
      // 1. Ищем подключенное устройство
      const targetDevice = await this.adbClient.findTargetDevice();
      if (!targetDevice || targetDevice.state !== 'device') {
        // Устройство не подключено или не авторизовано
        return { fetched: 0, newCount: 0, newMessages: [] };
      }

      // 2. Считываем свежие входящие SMS из Android Content Provider
      const incomingList = await this.adbClient.fetchInboxSms(targetDevice.serial, 30);
      if (incomingList.length === 0) {
        return { fetched: 0, newCount: 0, newMessages: [] };
      }

      // Получаем текущие данные о батарее для добавления в уведомление
      const currentHealth = this.healthMonitor.getCurrentHealth();
      const batteryInfo = currentHealth.device.battery.level !== null ? {
        level: currentHealth.device.battery.level,
        isCharging: currentHealth.device.battery.isCharging ?? false,
      } as any : null;
      const deviceModel = currentHealth.device.model || 'Meizu U20';

      // 3. Обрабатываем полученные сообщения
      // Сортируем по возрастанию времени, чтобы старые приходили первыми, а свежие последними
      const sortedIncoming = [...incomingList].sort((a, b) => a.receivedAt - b.receivedAt);

      for (const item of sortedIncoming) {
        const smsToSave: SmsRecord = {
          androidId: item.androidId,
          sender: item.sender,
          body: item.body,
          receivedAt: item.receivedAt,
        };

        const { record, isNew } = this.db.saveSms(smsToSave);

        if (isNew) {
          console.log(`[SmsPoller] 📩 Обнаружено НОВОЕ SMS от ${record.sender}: "${record.body.substring(0, 50)}..."`);
          newMessages.push(record);

          // 4. Отправляем уведомление в Telegram
          try {
            const sendResult = await this.notifier.sendSmsNotification(record, batteryInfo, deviceModel);
            if (sendResult.success && record.id) {
              this.db.markTelegramSent(record.id, sendResult.messageId);
              console.log(`[SmsPoller] ✅ SMS #${record.id} успешно переслано в Telegram (msg_id: ${sendResult.messageId})`);
            }
          } catch (notifErr: any) {
            console.error(`[SmsPoller] ❌ Ошибка отправки SMS #${record.id} в Telegram: ${notifErr.message}`);
          }
        }
      }

      return {
        fetched: incomingList.length,
        newCount: newMessages.length,
        newMessages,
      };
    } finally {
      this.isPolling = false;
    }
  }
}

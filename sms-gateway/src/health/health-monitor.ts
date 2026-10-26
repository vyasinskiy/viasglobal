import { AdbClient } from '../device/adb-client.ts';
import { DatabaseManager, type HealthLogRecord } from '../db/database.ts';
import { TelegramNotifier } from '../telegram/telegram-notifier.ts';
import type { AdbBatteryInfo, AdbTelephonyInfo } from '../device/adb-parser.ts';

/**
 * Интерфейс текущего состояния здоровья для API.
 */
export interface CurrentHealthState {
  status: 'ok' | 'warning' | 'error';
  message: string;
  service: string;
  uptimeSeconds: number;
  device: {
    connected: boolean;
    serial: string;
    model: string;
    manufacturer: string;
    androidVersion: string;
    state: string;
    battery: {
      level: number | null;
      isCharging: boolean | null;
      temperature: number | null;
      voltage: number | null;
      usbPowered: boolean | null;
    };
    sim: {
      state: string | null;
      operator: string | null;
      isReady: boolean | null;
    };
  };
  stats: {
    totalSmsReceived: number;
    lastSmsTimestamp: number | null;
  };
  lastCheckedAt: number;
}

/**
 * Класс периодического мониторинга здоровья подключенного устройства и окружения.
 */
export class HealthMonitor {
  private adbClient: AdbClient;
  private db: DatabaseManager;
  private notifier: TelegramNotifier;
  private checkIntervalMs: number;
  private lowBatteryThreshold: number;
  private startTime: number;

  private timer: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  // Предыдущее состояние подключения для фиксации перехода connected <-> disconnected
  private lastWasConnected: boolean | null = null;
  // Время последней отправки алерта о низком заряде (для ограничения частоты раз в 30 минут)
  private lastLowBatteryAlertTime: number = 0;

  // Кэшированные последние данные
  private cachedBattery: AdbBatteryInfo | null = null;
  private cachedTelephony: AdbTelephonyInfo | null = null;
  private cachedDeviceModel: string = 'Meizu U20';
  private cachedManufacturer: string = 'Meizu';
  private cachedAndroidVersion: string = '6.0';
  private cachedSerial: string = '';
  private cachedDeviceState: string = 'offline';
  private lastCheckedTimestamp: number = Date.now();

  constructor(
    adbClient: AdbClient,
    db: DatabaseManager,
    notifier: TelegramNotifier,
    checkIntervalMs: number = 60000,
    lowBatteryThreshold: number = 15
  ) {
    this.adbClient = adbClient;
    this.db = db;
    this.notifier = notifier;
    this.checkIntervalMs = checkIntervalMs;
    this.lowBatteryThreshold = lowBatteryThreshold;
    this.startTime = Date.now();
  }

  /**
   * Запуск периодического мониторинга.
   */
  public start(): void {
    if (this.timer) return;

    // Выполняем первую проверку немедленно
    this.checkHealth().catch((err) => {
      console.error(`[HealthMonitor] Ошибка первоначальной проверки: ${err.message}`);
    });

    // Устанавливаем интервал
    this.timer = setInterval(() => {
      this.checkHealth().catch((err) => {
        console.error(`[HealthMonitor] Ошибка периодической проверки: ${err.message}`);
      });
    }, this.checkIntervalMs);

    console.log(`[HealthMonitor] Мониторинг запущен с интервалом ${this.checkIntervalMs / 1000} сек`);
  }

  /**
   * Остановка мониторинга.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Выполнение одной итерации проверки здоровья.
   */
  public async checkHealth(): Promise<HealthLogRecord> {
    if (this.isChecking) {
      return (
        this.db.getLatestHealthLog() || {
          isConnected: false,
          status: 'warning',
          checkedAt: Date.now(),
        }
      );
    }

    this.isChecking = true;
    const now = Date.now();
    this.lastCheckedTimestamp = now;

    try {
      // 1. Проверяем наличие устройства через ADB
      const targetDevice = await this.adbClient.findTargetDevice();
      const isConnected = !!targetDevice && targetDevice.state === 'device';

      this.cachedSerial = targetDevice?.serial || '';
      this.cachedDeviceState = targetDevice?.state || 'disconnected';

      // 2. Отслеживаем изменение состояния подключения
      if (this.lastWasConnected !== null) {
        if (this.lastWasConnected && !isConnected) {
          // Телефон отключился!
          console.warn(`[HealthMonitor] Внимание: устройство ${this.cachedSerial || 'Meizu'} отключено!`);
          await this.notifier.sendDeviceDisconnectedAlert(this.cachedSerial || 'USB', this.cachedDeviceModel);
        } else if (!this.lastWasConnected && isConnected) {
          // Телефон снова подключился!
          console.log(`[HealthMonitor] Устройство ${this.cachedSerial} снова подключено!`);
          await this.notifier.sendDeviceReconnectedAlert(
            this.cachedSerial,
            this.cachedDeviceModel,
            this.cachedBattery?.level
          );
        }
      }
      this.lastWasConnected = isConnected;

      let batteryLevel: number | null = null;
      let isCharging: boolean | null = null;
      let temperature: number | null = null;
      let simState: string | null = null;
      let operator: string | null = null;
      let status: 'ok' | 'warning' | 'error' = 'ok';

      if (isConnected && targetDevice) {
        // Поддерживаем проброс портов через USB-кабель
        await this.adbClient.setupPortForwarding(targetDevice.serial);

        // 3. Запрашиваем информацию о батарее
        const battery = await this.adbClient.getBatteryStatus(targetDevice.serial);
        this.cachedBattery = battery;

        if (battery) {
          batteryLevel = battery.level;
          isCharging = battery.isCharging;
          temperature = battery.temperature;

          // Проверяем уровень заряда на критический порог
          if (battery.level <= this.lowBatteryThreshold && !battery.isCharging) {
            status = 'warning';
            // Отправляем алерт не чаще раза в 30 минут
            if (now - this.lastLowBatteryAlertTime > 30 * 60 * 1000) {
              this.lastLowBatteryAlertTime = now;
              await this.notifier.sendLowBatteryAlert(battery.level, battery.isCharging, this.cachedDeviceModel);
            }
          }
        }

        // 4. Запрашиваем информацию о SIM-карте
        const telephony = await this.adbClient.getTelephonyStatus(targetDevice.serial);
        this.cachedTelephony = telephony;
        if (telephony) {
          simState = telephony.simState;
          operator = telephony.operator;
          if (!telephony.isReady) {
            status = 'warning';
          }
        }

        // 5. Запрашиваем модель устройства (если еще не была определена)
        if (this.cachedDeviceModel === 'Meizu U20') {
          const info = await this.adbClient.getDeviceInfo(targetDevice.serial);
          if (info.model && info.model !== 'Android Phone') {
            this.cachedDeviceModel = info.model;
            this.cachedManufacturer = info.manufacturer;
            this.cachedAndroidVersion = info.androidVersion;
          }
        }
      } else {
        status = 'error';
      }

      const logRecord: HealthLogRecord = {
        isConnected,
        batteryLevel,
        isCharging,
        temperature,
        simState,
        operator,
        status,
        checkedAt: now,
      };

      // Сохраняем снимок в БД
      this.db.saveHealthLog(logRecord);

      return logRecord;
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Получение текущего структурированного состояния для REST API (`GET /health`).
   */
  public getCurrentHealth(): CurrentHealthState {
    const isConnected = this.lastWasConnected === true;
    const stats = this.db.getStats();

    let status: 'ok' | 'warning' | 'error' = 'ok';
    let message = 'SMS Gateway и мобильный телефон функционируют в штатном режиме';

    if (!isConnected) {
      status = 'error';
      message = 'Телефон Meizu отключен от USB или не авторизован в ADB';
    } else if (this.cachedBattery && this.cachedBattery.level <= this.lowBatteryThreshold) {
      status = 'warning';
      message = `Низкий уровень заряда батареи телефона: ${this.cachedBattery.level}%`;
    } else if (this.cachedTelephony && !this.cachedTelephony.isReady) {
      status = 'warning';
      message = `SIM-карта не готова к приему SMS (статус: ${this.cachedTelephony.simState})`;
    }

    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status,
      message,
      service: 'sms-gateway',
      uptimeSeconds,
      device: {
        connected: isConnected,
        serial: this.cachedSerial,
        model: this.cachedDeviceModel,
        manufacturer: this.cachedManufacturer,
        androidVersion: this.cachedAndroidVersion,
        state: this.cachedDeviceState,
        battery: {
          level: this.cachedBattery?.level ?? null,
          isCharging: this.cachedBattery?.isCharging ?? null,
          temperature: this.cachedBattery?.temperature ?? null,
          voltage: this.cachedBattery?.voltage ?? null,
          usbPowered: this.cachedBattery?.usbPowered ?? null,
        },
        sim: {
          state: this.cachedTelephony?.simState ?? null,
          operator: this.cachedTelephony?.operator ?? null,
          isReady: this.cachedTelephony?.isReady ?? null,
        },
      },
      stats: {
        totalSmsReceived: stats.totalSms,
        lastSmsTimestamp: stats.lastSmsTimestamp,
      },
      lastCheckedAt: this.lastCheckedTimestamp,
    };
  }
}

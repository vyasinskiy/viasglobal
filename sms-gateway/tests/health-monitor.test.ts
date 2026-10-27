import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HealthMonitor } from '../src/health/health-monitor.ts';
import { DatabaseManager } from '../src/db/database.ts';
import { TelegramNotifier } from '../src/telegram/telegram-notifier.ts';
import type { AdbBatteryInfo } from '../src/device/adb-parser.ts';

describe('Модуль мониторинга здоровья устройства (HealthMonitor)', () => {
  it('Игнорирует аномальные показания 0% при высоком напряжении и не отправляет ложный алерт в Telegram', async () => {
    // Временная база данных в памяти
    const db = new DatabaseManager(':memory:');

    let lowBatteryAlertSent = false;
    const mockNotifier = {
      sendLowBatteryAlert: async () => {
        lowBatteryAlertSent = true;
        return true;
      },
      sendBatteryRecoveredAlert: async () => true,
      sendDeviceRebootedAlert: async () => true,
      sendDeviceDisconnectedAlert: async () => true,
      sendDeviceReconnectedAlert: async () => true,
    } as unknown as TelegramNotifier;

    // Имитируем ADB клиент, отдающий аномальные 0% при напряжении 4396 мВ
    const mockAdb = {
      findTargetDevice: async () => ({ serial: 'U20AVCPM22MQH', state: 'device' }),
      setupPortForwarding: async () => true,
      getDeviceUptime: async () => 86000,
      getBatteryStatus: async (): Promise<AdbBatteryInfo> => ({
        level: 0,
        voltage: 4396,
        isPowered: false,
        isCharging: false,
        temperature: 32.0,
        usbPowered: false,
        acPowered: false,
        present: true,
        rawStatus: 1,
      }),
      getTelephonyStatus: async () => ({ simState: 'READY', operator: 'DIGI', isReady: true }),
      getDeviceInfo: async () => ({ model: 'U20', manufacturer: 'Meizu', androidVersion: '6.0' }),
    } as any;

    const monitor = new HealthMonitor(mockAdb, db, mockNotifier, 60000, 15);
    const result = await monitor.checkHealth();

    // Проверяем, что ложный алерт о 0% батареи НЕ был отправлен
    assert.strictEqual(lowBatteryAlertSent, false, 'Ложный алерт не должен отправляться при напряжении 4396 мВ');
    // Статус батареи не должен установиться в 0
    assert.strictEqual(result.batteryLevel, null);
    db.close();
  });

  it('Отправляет оповещение о восстановлении питания после возвращения заряда в норму', async () => {
    const db = new DatabaseManager(':memory:');

    let recoveredLevel = 0;
    let recoveredAlertCalled = false;

    const mockNotifier = {
      sendLowBatteryAlert: async () => true,
      sendBatteryRecoveredAlert: async (level: number) => {
        recoveredAlertCalled = true;
        recoveredLevel = level;
        return true;
      },
      sendDeviceRebootedAlert: async () => true,
      sendDeviceDisconnectedAlert: async () => true,
      sendDeviceReconnectedAlert: async () => true,
    } as unknown as TelegramNotifier;

    let batteryState: AdbBatteryInfo = {
      level: 10,
      voltage: 3400,
      isPowered: false,
      isCharging: false,
      temperature: 30.0,
      usbPowered: false,
      acPowered: false,
      present: true,
      rawStatus: 3,
    };

    const mockAdb = {
      findTargetDevice: async () => ({ serial: 'U20AVCPM22MQH', state: 'device' }),
      setupPortForwarding: async () => true,
      getDeviceUptime: async () => 86000,
      getBatteryStatus: async () => batteryState,
      getTelephonyStatus: async () => ({ simState: 'READY', operator: 'DIGI', isReady: true }),
      getDeviceInfo: async () => ({ model: 'U20', manufacturer: 'Meizu', androidVersion: '6.0' }),
    } as any;

    const monitor = new HealthMonitor(mockAdb, db, mockNotifier, 60000, 15);

    // 1-я проверка: реальный низкий заряд (10% при 3400 мВ, не заряжается)
    await monitor.checkHealth();

    // 2-я проверка: телефон подключили к питанию, уровень поднялся до 50%
    batteryState = {
      level: 50,
      voltage: 4390,
      isPowered: true,
      isCharging: true,
      temperature: 32.0,
      usbPowered: true,
      acPowered: false,
      present: true,
      rawStatus: 2,
    };

    await monitor.checkHealth();

    // Проверяем, что было отправлено уведомление о восстановлении питания
    assert.strictEqual(recoveredAlertCalled, true, 'Должен быть вызван sendBatteryRecoveredAlert');
    assert.strictEqual(recoveredLevel, 50, 'Уровень восстановленного заряда должен быть 50%');
    db.close();
  });

  it('Детектирует сброс uptime устройства и отправляет оповещение о перезагрузке телефона', async () => {
    const db = new DatabaseManager(':memory:');

    let rebootAlertTriggered = false;
    let rebootSerial = '';

    const mockNotifier = {
      sendLowBatteryAlert: async () => true,
      sendBatteryRecoveredAlert: async () => true,
      sendDeviceRebootedAlert: async (serial: string) => {
        rebootAlertTriggered = true;
        rebootSerial = serial;
        return true;
      },
      sendDeviceDisconnectedAlert: async () => true,
      sendDeviceReconnectedAlert: async () => true,
    } as unknown as TelegramNotifier;

    let deviceUptime = 86400; // 24 часа работы

    const mockAdb = {
      findTargetDevice: async () => ({ serial: 'U20AVCPM22MQH', state: 'device' }),
      setupPortForwarding: async () => true,
      getDeviceUptime: async () => deviceUptime,
      getBatteryStatus: async () => ({
        level: 100,
        voltage: 4396,
        isPowered: true,
        isCharging: true,
        temperature: 32.0,
        usbPowered: true,
        acPowered: false,
        present: true,
        rawStatus: 5,
      }),
      getTelephonyStatus: async () => ({ simState: 'READY', operator: 'DIGI', isReady: true }),
      getDeviceInfo: async () => ({ model: 'U20', manufacturer: 'Meizu', androidVersion: '6.0' }),
    } as any;

    const monitor = new HealthMonitor(mockAdb, db, mockNotifier, 60000, 15);

    // 1-я проверка: устройство работает 86400 секунд
    await monitor.checkHealth();
    assert.strictEqual(rebootAlertTriggered, false);

    // 2-я проверка: произошла перезагрузка, uptime сбросился до 45 секунд
    deviceUptime = 45;
    await monitor.checkHealth();

    // Проверяем, что сработал алерт о перезагрузке
    assert.strictEqual(rebootAlertTriggered, true, 'Должен быть вызван sendDeviceRebootedAlert');
    assert.strictEqual(rebootSerial, 'U20AVCPM22MQH');
    db.close();
  });
});

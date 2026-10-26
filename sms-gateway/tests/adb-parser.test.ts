import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseAdbDevices,
  parseBatteryInfo,
  parseSmsContentQuery,
  parseTelephonyInfo,
} from '../src/device/adb-parser.ts';

describe('Модуль парсинга вывода ADB (adb-parser)', () => {
  describe('Парсинг списка подключенных устройств (parseAdbDevices)', () => {
    it('Корректно распознает активное авторизованное устройство Meizu U20', () => {
      // Имитируем вывод adb devices -l для Meizu U20
      const output = `
List of devices attached
U20AVCPM22MQH          device usb:1-5 product:U20 model:U20 device:U20
`;
      const devices = parseAdbDevices(output);

      // Проверяем количество и параметры найденного устройства
      assert.strictEqual(devices.length, 1);
      assert.strictEqual(devices[0].serial, 'U20AVCPM22MQH');
      assert.strictEqual(devices[0].state, 'device');
      assert.strictEqual(devices[0].model, 'U20');
      assert.strictEqual(devices[0].product, 'U20');
    });

    it('Корректно обрабатывает неавторизованные и отключенные устройства', () => {
      const output = `
List of devices attached
U20AVCPM22MQH          unauthorized usb:1-5
emulator-5554          offline
`;
      const devices = parseAdbDevices(output);

      assert.strictEqual(devices.length, 2);
      assert.strictEqual(devices[0].serial, 'U20AVCPM22MQH');
      assert.strictEqual(devices[0].state, 'unauthorized');
      assert.strictEqual(devices[1].serial, 'emulator-5554');
      assert.strictEqual(devices[1].state, 'offline');
    });

    it('Возвращает пустой массив при отсутствии подключенных устройств', () => {
      const output = `
List of devices attached

`;
      const devices = parseAdbDevices(output);
      assert.strictEqual(devices.length, 0);
    });
  });

  describe('Парсинг состояния батареи (parseBatteryInfo)', () => {
    it('Корректно преобразует параметры батареи при зарядке по USB', () => {
      // Имитируем реальный вывод dumpsys battery на Meizu U20
      const output = `
Current Battery Service state:
  AC powered: false
  USB powered: true
  Wireless powered: false
  Max charging current: 500000
  Max charging voltage: 5000000
  Charge counter: 2800000
  status: 2
  health: 2
  present: true
  level: 87
  scale: 100
  voltage: 4150
  temperature: 285
  technology: Li-ion
`;
      const info = parseBatteryInfo(output);

      // Проверяем уровень заряда
      assert.strictEqual(info.level, 87);
      // Проверяем флаги питания
      assert.strictEqual(info.usbPowered, true);
      assert.strictEqual(info.acPowered, false);
      assert.strictEqual(info.isCharging, true);
      // Проверяем перевод температуры из 285 в 28.5 градусов Цельсия
      assert.strictEqual(info.temperature, 28.5);
      // Проверяем напряжение
      assert.strictEqual(info.voltage, 4150);
      assert.strictEqual(info.present, true);
    });

    it('Корректно определяет разрядку батареи при отключенном питании', () => {
      const output = `
Current Battery Service state:
  AC powered: false
  USB powered: false
  status: 3
  level: 12
  temperature: 310
`;
      const info = parseBatteryInfo(output);

      assert.strictEqual(info.level, 12);
      assert.strictEqual(info.isCharging, false);
      assert.strictEqual(info.usbPowered, false);
      assert.strictEqual(info.temperature, 31.0);
    });
  });

  describe('Парсинг выгрузки входящих SMS (parseSmsContentQuery)', () => {
    it('Корректно извлекает поля SMS банковского терминала с испанскими символами и суммами', () => {
      // Имитируем вывод content query со строкой от CaixaBank
      const output = `
Row: 0 _id=142, address=CaixaBank, date=1730005000000, type=1, body=Operacion terminal 450,00 EUR completada. Codigo autorizacion: 948271
`;
      const messages = parseSmsContentQuery(output);

      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0].androidId, '142');
      assert.strictEqual(messages[0].sender, 'CaixaBank');
      assert.strictEqual(messages[0].receivedAt, 1730005000000);
      assert.strictEqual(messages[0].type, 1);
      assert.strictEqual(
        messages[0].body,
        'Operacion terminal 450,00 EUR completada. Codigo autorizacion: 948271'
      );
    });

    it('Корректно обрабатывает многострочные сообщения и запятые внутри текста', () => {
      const output = `
Row: 0 _id=101, address=+34612345678, date=1730001000000, type=1, body=Hola, he realizado el ingreso en el cajero.
Adjunto el justificante, importe: 350 EUR.
Gracias!
Row: 1 _id=102, address=BBVA, date=1730002000000, type=1, body=Su clave de acceso es 8492
`;
      const messages = parseSmsContentQuery(output);

      assert.strictEqual(messages.length, 2);

      // Первое сообщение (многострочное с запятыми)
      assert.strictEqual(messages[0].androidId, '101');
      assert.strictEqual(messages[0].sender, '+34612345678');
      assert.ok(messages[0].body.includes('importe: 350 EUR.'));
      assert.ok(messages[0].body.includes('Gracias!'));

      // Второе сообщение
      assert.strictEqual(messages[1].androidId, '102');
      assert.strictEqual(messages[1].sender, 'BBVA');
      assert.strictEqual(messages[1].body, 'Su clave de acceso es 8492');
    });
  });

  describe('Парсинг статуса SIM-карты и оператора (parseTelephonyInfo)', () => {
    it('Корректно распознает активную SIM-карту и оператора DIGI mobil', () => {
      const info = parseTelephonyInfo('READY,ABSENT', 'DIGI mobil');
      assert.strictEqual(info.isReady, true);
      assert.strictEqual(info.operator, 'DIGI mobil');
    });

    it('Корректно обрабатывает отсутствие SIM-карты', () => {
      const info = parseTelephonyInfo('ABSENT', '');
      assert.strictEqual(info.isReady, false);
      assert.strictEqual(info.operator, 'Нет сети');
    });
  });
});

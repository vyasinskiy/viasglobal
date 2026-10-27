import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  type AdbDeviceItem,
  type AdbBatteryInfo,
  type AdbParsedSms,
  type AdbTelephonyInfo,
  parseAdbDevices,
  parseBatteryInfo,
  parseSmsContentQuery,
  parseTelephonyInfo,
} from './adb-parser.ts';

const execFileAsync = promisify(execFile);

/**
 * Класс клиента для взаимодействия с Android Debug Bridge (ADB).
 */
export class AdbClient {
  private adbPath: string;
  private preferredSerial: string;

  constructor(adbPath: string = 'adb', preferredSerial: string = '') {
    this.adbPath = adbPath;
    this.preferredSerial = preferredSerial;
  }

  /**
   * Выполнение команды ADB с контролем времени выполнения (таймаут 10 сек).
   */
  private async runAdb(args: string[], timeoutMs: number = 10000): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.adbPath, args, {
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // 10 МБ буфер для больших списков SMS
        encoding: 'utf8',
      });
      return stdout;
    } catch (error: any) {
      const stderr = error.stderr ? error.stderr.toString().trim() : '';
      const msg = error.message || String(error);
      throw new Error(`Ошибка вызова ADB [${this.adbPath} ${args.join(' ')}]: ${stderr || msg}`);
    }
  }

  /**
   * Проверка доступности исполняемого файла ADB в системе.
   */
  public async checkAdbInstalled(): Promise<boolean> {
    try {
      const output = await this.runAdb(['version']);
      return output.includes('Android Debug Bridge');
    } catch {
      return false;
    }
  }

  /**
   * Получение списка всех подключенных USB/TCP устройств через `adb devices -l`.
   */
  public async getConnectedDevices(): Promise<AdbDeviceItem[]> {
    try {
      const stdout = await this.runAdb(['devices', '-l']);
      return parseAdbDevices(stdout);
    } catch (error: any) {
      console.error(`[AdbClient] Ошибка получения списка устройств: ${error.message}`);
      return [];
    }
  }

  /**
   * Поиск целевого активного устройства для работы.
   * Если задан preferredSerial, ищет именно его.
   * Иначе выбирает первое авторизованное устройство со статусом 'device'.
   */
  public async findTargetDevice(): Promise<AdbDeviceItem | null> {
    const devices = await this.getConnectedDevices();
    if (devices.length === 0) {
      return null;
    }

    if (this.preferredSerial) {
      const found = devices.find((d) => d.serial === this.preferredSerial);
      return found || null;
    }

    // Ищем первое авторизованное устройство
    const activeDevice = devices.find((d) => d.state === 'device');
    return activeDevice || devices[0];
  }

  /**
   * Запрос информации о батарее через `dumpsys battery`.
   */
  public async getBatteryStatus(serial: string): Promise<AdbBatteryInfo | null> {
    try {
      const stdout = await this.runAdb(['-s', serial, 'shell', 'dumpsys', 'battery']);
      return parseBatteryInfo(stdout);
    } catch (error: any) {
      console.error(`[AdbClient] Ошибка получения состояния батареи (${serial}): ${error.message}`);
      return null;
    }
  }

  /**
   * Настройка двустороннего проброса портов через USB-кабель:
   * - forward tcp:8080 tcp:8080 (доступ сервера к API телефона)
   * - reverse tcp:3040 tcp:3040 (доступ телефона к webhook сервера через кабель)
   */
  public async setupPortForwarding(serial: string): Promise<boolean> {
    try {
      await this.runAdb(['-s', serial, 'forward', 'tcp:8080', 'tcp:8080']);
      await this.runAdb(['-s', serial, 'reverse', 'tcp:3040', 'tcp:3040']);
      return true;
    } catch (err: any) {
      console.warn(
        `[AdbClient] Предупреждение: ошибка настройки forward/reverse портов (${serial}): ${err.message}`
      );
      return false;
    }
  }

  /**
   * Запрос информации о сотовой сети и SIM-карте.
   */
  public async getTelephonyStatus(serial: string): Promise<AdbTelephonyInfo | null> {
    try {
      // Запрашиваем состояние SIM-карты
      const simState = await this.runAdb(['-s', serial, 'shell', 'getprop', 'gsm.sim.state']);
      // Запрашиваем название оператора
      const operator = await this.runAdb(['-s', serial, 'shell', 'getprop', 'gsm.operator.alpha']);

      return parseTelephonyInfo(simState, operator);
    } catch (error: any) {
      console.error(`[AdbClient] Ошибка получения статуса SIM-карты (${serial}): ${error.message}`);
      return null;
    }
  }

  /**
   * Запрос базовой информации об устройстве (модель, производитель, версия Android).
   */
  public async getDeviceInfo(serial: string): Promise<{
    model: string;
    manufacturer: string;
    androidVersion: string;
  }> {
    try {
      const model = (await this.runAdb(['-s', serial, 'shell', 'getprop', 'ro.product.model'])).trim();
      const manufacturer = (
        await this.runAdb(['-s', serial, 'shell', 'getprop', 'ro.product.manufacturer'])
      ).trim();
      const androidVersion = (
        await this.runAdb(['-s', serial, 'shell', 'getprop', 'ro.build.version.release'])
      ).trim();

      return {
        model: model || 'Android Phone',
        manufacturer: manufacturer || 'OEM',
        androidVersion: androidVersion || 'Unknown',
      };
    } catch {
      return {
        model: 'Android Phone',
        manufacturer: 'OEM',
        androidVersion: 'Unknown',
      };
    }
  }

  /**
   * Запрос времени непрерывной работы устройства (uptime) в секундах из /proc/uptime.
   * Возвращает null при ошибке или недоступности устройства.
   */
  public async getDeviceUptime(serial: string): Promise<number | null> {
    try {
      const stdout = await this.runAdb(['-s', serial, 'shell', 'cat', '/proc/uptime']);
      const parts = stdout.trim().split(/\s+/);
      if (parts.length > 0) {
        const uptimeSeconds = parseFloat(parts[0]);
        if (!isNaN(uptimeSeconds) && uptimeSeconds >= 0) {
          return uptimeSeconds;
        }
      }
      return null;
    } catch (error: any) {
      console.warn(`[AdbClient] Ошибка получения uptime (${serial}): ${error.message}`);
      return null;
    }
  }

  /**
   * Запрос списка входящих SMS из системного хранилища Android через Content Provider.
   *
   * Используется проекция: _id,address,date,type,body
   * Фильтр: type=1 (только входящие сообщения)
   * Сортировка: date DESC (начиная с самых свежих)
   */
  public async fetchInboxSms(serial: string, limit: number = 30): Promise<AdbParsedSms[]> {
    try {
      // Формируем вызов content query
      const args = [
        '-s',
        serial,
        'shell',
        'content',
        'query',
        '--uri',
        'content://sms',
        '--where',
        'type=1',
        '--projection',
        '_id,address,date,type,body',
        '--sort',
        'date DESC',
      ];

      // Ограничиваем количество строк, если поддерживается
      if (limit > 0) {
        // Запрос к Android content query
        const stdout = await this.runAdb(args);
        const parsed = parseSmsContentQuery(stdout);
        return parsed.slice(0, limit);
      } else {
        const stdout = await this.runAdb(args);
        return parseSmsContentQuery(stdout);
      }
    } catch (error: any) {
      console.error(`[AdbClient] Ошибка чтения SMS через content query (${serial}): ${error.message}`);
      return [];
    }
  }
}

/**
 * Интерфейс описания подключенного Android-устройства.
 */
export interface AdbDeviceItem {
  /** Серийный номер устройства */
  serial: string;
  /** Состояние подключения: 'device', 'offline', 'unauthorized', 'recovery' */
  state: 'device' | 'offline' | 'unauthorized' | 'recovery' | string;
  /** Модель устройства (если определена, например, U20) */
  model?: string;
  /** Название продукта (например, U20) */
  product?: string;
  /** Имя устройства */
  device?: string;
}

/**
 * Интерфейс данных о батарее устройства.
 */
export interface AdbBatteryInfo {
  /** Уровень заряда в процентах (0-100) */
  level: number;
  /** Флаг подключения питания (USB или AC) */
  isPowered: boolean;
  /** Флаг зарядки (status === 2 или USB/AC powered) */
  isCharging: boolean;
  /** Температура батареи в градусах Цельсия (например, 29.5) */
  temperature: number;
  /** Напряжение в милливольтах (например, 4120) */
  voltage: number;
  /** Питание по USB */
  usbPowered: boolean;
  /** Питание от адаптера 220V (AC) */
  acPowered: boolean;
  /** Присутствие батареи в устройстве */
  present: boolean;
  /** Сырой статус батареи (2 - CHARGING, 3 - DISCHARGING, 5 - FULL) */
  rawStatus: number;
}

/**
 * Интерфейс распарсенного SMS из Android Content Provider.
 */
export interface AdbParsedSms {
  /** Идентификатор строки _id */
  androidId: string;
  /** Номер телефона или текстовое имя отправителя */
  sender: string;
  /** Текст сообщения */
  body: string;
  /** Время получения в миллисекундах (epoch ms) */
  receivedAt: number;
  /** Тип сообщения (1 - INBOX входящее, 2 - SENT отправленное) */
  type: number;
}

/**
 * Интерфейс данных о SIM-карте и сотовой связи.
 */
export interface AdbTelephonyInfo {
  /** Состояние SIM-карты (READY, ABSENT, PIN_REQUIRED и т.д.) */
  simState: string;
  /** Имя сотового оператора (например, DIGI mobil, Movistar) */
  operator: string;
  /** Флаг готовности SIM-карты к приему звонков и SMS */
  isReady: boolean;
}

/**
 * Парсинг вывода команды `adb devices -l`.
 *
 * Пример входных данных:
 * List of devices attached
 * U20AVCPM22MQH          device usb:1-5 product:U20 model:U20 device:U20
 * emulator-5554          offline
 */
export function parseAdbDevices(output: string): AdbDeviceItem[] {
  const devices: AdbDeviceItem[] = [];
  // Разбиваем построчно
  const lines = output.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Пропускаем заголовок и пустые строки
    if (!trimmed || trimmed.startsWith('List of devices') || trimmed.startsWith('* daemon')) {
      continue;
    }

    // Выделяем серийный номер и статус (первые два слова)
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    const serial = parts[0];
    const state = parts[1];

    let model: string | undefined;
    let product: string | undefined;
    let device: string | undefined;

    // Извлекаем параметры вида key:value
    for (let i = 2; i < parts.length; i++) {
      const token = parts[i];
      if (token.startsWith('model:')) {
        model = token.substring('model:'.length);
      } else if (token.startsWith('product:')) {
        product = token.substring('product:'.length);
      } else if (token.startsWith('device:')) {
        device = token.substring('device:'.length);
      }
    }

    devices.push({
      serial,
      state,
      model,
      product,
      device,
    });
  }

  return devices;
}

/**
 * Парсинг вывода команды `adb shell dumpsys battery`.
 *
 * Пример входных данных:
 * Current Battery Service state:
 *   AC powered: false
 *   USB powered: true
 *   Wireless powered: false
 *   status: 2
 *   health: 2
 *   present: true
 *   level: 85
 *   scale: 100
 *   voltage: 4120
 *   temperature: 290
 *   technology: Li-ion
 */
export function parseBatteryInfo(output: string): AdbBatteryInfo {
  // Значения по умолчанию
  let level = 0;
  let status = 1; // 1 = UNKNOWN, 2 = CHARGING, 3 = DISCHARGING, 5 = FULL
  let present = true;
  let acPowered = false;
  let usbPowered = false;
  let voltage = 0;
  let rawTemperature = 0;

  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.trim().match(/^([a-zA-Z\s]+):\s*(.+)$/);
    if (!match) continue;

    const key = match[1].trim().toLowerCase();
    const val = match[2].trim();

    if (key === 'level') {
      level = parseInt(val, 10) || 0;
    } else if (key === 'status') {
      status = parseInt(val, 10) || 1;
    } else if (key === 'present') {
      present = val.toLowerCase() === 'true';
    } else if (key === 'ac powered') {
      acPowered = val.toLowerCase() === 'true';
    } else if (key === 'usb powered') {
      usbPowered = val.toLowerCase() === 'true';
    } else if (key === 'voltage') {
      voltage = parseInt(val, 10) || 0;
    } else if (key === 'temperature') {
      rawTemperature = parseInt(val, 10) || 0;
    }
  }

  // В Android температура отдается в десятых долях градуса Цельсия (например, 290 = 29.0°C)
  const temperature = rawTemperature > 0 ? parseFloat((rawTemperature / 10).toFixed(1)) : 25.0;

  // Флаг зарядки: либо статус равен 2 (CHARGING) или 5 (FULL), либо идет питание по USB/AC
  const isPowered = acPowered || usbPowered;
  const isCharging = status === 2 || (isPowered && status !== 3);

  return {
    level,
    isPowered,
    isCharging,
    temperature,
    voltage,
    usbPowered,
    acPowered,
    present,
    rawStatus: status,
  };
}

/**
 * Парсинг вывода команды `adb shell content query --uri content://sms ...`.
 *
 * Ожидается проекция: `--projection _id,address,date,type,body`
 * Формат вывода Android:
 * Row: 0 _id=142, address=CaixaBank, date=1730001234567, type=1, body=Su codigo es 9283
 * Row: 1 _id=143, address=+34612345678, date=1730002345678, type=1, body=Linea 1
 * Linea 2 con coma, y acento: 450,00 EUR
 */
export function parseSmsContentQuery(output: string): AdbParsedSms[] {
  const result: AdbParsedSms[] = [];
  if (!output || !output.includes('Row:')) {
    return result;
  }

  // Разделяем весь вывод на блоки строк перед каждым "Row: <N>"
  const rowBlocks = output.split(/(?=^Row:\s*\d+)/m);

  for (const block of rowBlocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock.startsWith('Row:')) {
      continue;
    }

    // Сопоставляем фиксированные поля заголовка и забираем все остальное как body
    const match = trimmedBlock.match(
      /^Row:\s*\d+\s+_id=([^,]+),\s*address=([^,]+),\s*date=([^,]+),\s*type=([^,]+),\s*body=([\s\S]*)$/
    );

    if (!match) {
      continue;
    }

    const androidId = match[1].trim();
    let sender = match[2].trim();
    const rawDate = match[3].trim();
    const rawType = match[4].trim();
    let body = match[5].trim();

    // Очищаем адрес от возможных кавычек
    if (sender.startsWith('"') && sender.endsWith('"')) {
      sender = sender.substring(1, sender.length - 1);
    }
    if (sender === 'null' || !sender) {
      sender = 'НЕИЗВЕСТНЫЙ';
    }

    // Парсим дату и тип
    const receivedAt = parseInt(rawDate, 10) || Date.now();
    const type = parseInt(rawType, 10) || 1;

    // Очищаем текст сообщения от возможных внешних кавычек
    if (body.startsWith('"') && body.endsWith('"') && body.length >= 2) {
      body = body.substring(1, body.length - 1);
    }

    // Сохраняем только валидные сообщения
    if (androidId && body) {
      result.push({
        androidId,
        sender,
        body,
        receivedAt,
        type,
      });
    }
  }

  return result;
}

/**
 * Парсинг свойств сотовой связи и SIM-карты.
 */
export function parseTelephonyInfo(simStateRaw: string, operatorRaw: string): AdbTelephonyInfo {
  const simStateClean = (simStateRaw || '').trim().replace(/\r/g, '');
  const operatorClean = (operatorRaw || '').trim().replace(/\r/g, '');

  // На двухсимочных телефонах статус может возвращаться через запятую: "READY,READY" или "READY,ABSENT"
  const states = simStateClean.split(',').map((s) => s.trim().toUpperCase());
  const isReady = states.includes('READY');

  const operator = operatorClean || (isReady ? 'SIM Активна' : 'Нет сети');

  return {
    simState: simStateClean || 'UNKNOWN',
    operator,
    isReady,
  };
}

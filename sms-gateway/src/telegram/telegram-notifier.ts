import type { SmsRecord, HealthLogRecord } from '../db/database.ts';
import type { AdbBatteryInfo } from '../device/adb-parser.ts';

/**
 * Класс отправки уведомлений и форвардинга SMS сообщений в Telegram.
 */
export class TelegramNotifier {
  private botToken: string;
  private chatIds: string[];
  private isEnabled: boolean;
  private timezone: string;

  constructor(
    botToken: string,
    chatIds: string[],
    isEnabled: boolean = true,
    timezone: string = 'Europe/Madrid'
  ) {
    this.botToken = botToken;
    this.chatIds = chatIds;
    this.isEnabled = isEnabled;
    this.timezone = timezone;
  }

  /**
   * Отправка произвольного HTML-сообщения во все настроенные Telegram-чаты.
   */
  private async sendMessage(htmlText: string): Promise<{ success: boolean; messageId?: number }> {
    if (!this.isEnabled || !this.botToken || this.chatIds.length === 0) {
      return { success: false };
    }

    // Проверяем текст на запрещенные длинные и средние тире согласно регламенту проекта
    const sanitizedText = htmlText.replace(/[—–]/g, '-');

    let firstMessageId: number | undefined;
    let anySuccess = false;

    for (const chatId of this.chatIds) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: sanitizedText,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        });

        const data = (await response.json()) as any;
        if (data && data.ok) {
          anySuccess = true;
          if (!firstMessageId && data.result?.message_id) {
            firstMessageId = data.result.message_id;
          }
        } else {
          console.error(
            `[TelegramNotifier] Ошибка отправки в чат ${chatId}: ${data?.description || 'Неизвестная ошибка'}`
          );
        }
      } catch (error: any) {
        console.error(`[TelegramNotifier] Сетевая ошибка при отправке в чат ${chatId}: ${error.message}`);
      }
    }

    return { success: anySuccess, messageId: firstMessageId };
  }

  /**
   * Форматирование даты в красивую читаемую строку по таймзоне Мадрида / Испании.
   */
  private formatDate(timestamp: number): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ru-RU', {
        timeZone: this.timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return new Date(timestamp).toISOString();
    }
  }

  /**
   * Экранирование специальных символов HTML для безопасного вывода текста сообщения.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Анализ текста SMS на предмет сумм в EUR и одноразовых кодов авторизации терминала.
   */
  private highlightAmountsAndCodes(body: string): { amount?: string; code?: string } {
    let amount: string | undefined;
    let code: string | undefined;

    // Поиск сумм вида: "450 EUR", "450,00 EUR", "450.00 €", "450€"
    const amountMatch = body.match(/(\d+([.,]\d{1,2})?)\s*(EUR|€)/i);
    if (amountMatch) {
      amount = `${amountMatch[1]} EUR`;
    }

    // Поиск кодов авторизации вида: "codigo: 123456", "clave: 1234", "code: 123456"
    const codeMatch = body.match(/(?:c[oó]digo|clave|code|otp|passcode)[:\s]+([0-9A-Z]{4,8})/i);
    if (codeMatch) {
      code = codeMatch[1];
    }

    return { amount, code };
  }

  /**
   * Форвардинг нового входящего SMS сообщения владельцу в Telegram.
   */
  public async sendSmsNotification(
    sms: SmsRecord,
    batteryInfo?: AdbBatteryInfo | null,
    model: string = 'Meizu U20'
  ): Promise<{ success: boolean; messageId?: number }> {
    const timeFormatted = this.formatDate(sms.receivedAt);
    const escapedSender = this.escapeHtml(sms.sender);
    const escapedBody = this.escapeHtml(sms.body);

    const { amount, code } = this.highlightAmountsAndCodes(sms.body);

    // Формируем блок со статусом батареи
    let batteryText = '';
    if (batteryInfo) {
      const icon = batteryInfo.isCharging ? '⚡' : '🔋';
      batteryText = ` | ${icon} ${batteryInfo.level}%`;
    }

    let highlightsBlock = '';
    if (amount || code) {
      highlightsBlock = `\n`;
      if (amount) {
        highlightsBlock += `💰 <b>Сумма операции:</b> <code>${amount}</code>\n`;
      }
      if (code) {
        highlightsBlock += `🔑 <b>Код авторизации:</b> <code>${code}</code>\n`;
      }
    }

    const html = `📩 <b>Новое входящее SMS</b>

👤 <b>Отправитель:</b> <code>${escapedSender}</code>
⏰ <b>Время:</b> <code>${timeFormatted}</code>
📱 <b>Устройство:</b> ${model}${batteryText}${highlightsBlock}
💬 <b>Текст сообщения:</b>
<blockquote>${escapedBody}</blockquote>`;

    return this.sendMessage(html);
  }

  /**
   * Отправка тревожного оповещения об отключении телефона от USB кабеля.
   */
  public async sendDeviceDisconnectedAlert(serial: string, model: string = 'Телефон'): Promise<boolean> {
    const html = `🚨 <b>ВНИМАНИЕ: Телефон отключен от сервера!</b>

❌ <b>Устройство:</b> ${model} (${serial})
⚠️ <b>Проблема:</b> Потеряно USB-соединение с телефоном на сервере Huawei.
Прием входящих SMS временно приостановлен! Проверьте надежность подключения USB-кабеля.`;

    const { success } = await this.sendMessage(html);
    return success;
  }

  /**
   * Отправка оповещения о восстановлении USB-соединения с телефоном.
   */
  public async sendDeviceReconnectedAlert(
    serial: string,
    model: string = 'Телефон',
    batteryLevel?: number
  ): Promise<boolean> {
    const batteryText = batteryLevel !== undefined ? `Заряд батареи: ${batteryLevel}%` : '';
    const html = `🟢 <b>Телефон снова на связи!</b>

✅ <b>Устройство:</b> ${model} (${serial})
🔌 USB-соединение с сервером Huawei восстановлено.
${batteryText}
Прием и форвардинг входящих SMS продолжаются в штатном режиме.`;

    const { success } = await this.sendMessage(html);
    return success;
  }

  /**
   * Отправка предупреждения о критически низком заряде батареи телефона.
   */
  public async sendLowBatteryAlert(
    level: number,
    isCharging: boolean,
    model: string = 'Телефон'
  ): Promise<boolean> {
    const chargingIcon = isCharging ? '⚡ Заряжается от USB' : '❌ НЕ заряжается (проверьте кабель/порт!)';
    const html = `🪫 <b>ВНИМАНИЕ: Низкий уровень заряда батареи!</b>

📱 <b>Устройство:</b> ${model}
🔋 <b>Текущий заряд:</b> ${level}%
🔌 <b>Статус питания:</b> ${chargingIcon}

Если телефон выключится, прием SMS от арендаторов прекратится!`;

    const { success } = await this.sendMessage(html);
    return success;
  }

  /**
   * Отправка периодического отчета о здоровье системы (Health Check).
   */
  public async sendHealthReport(
    health: HealthLogRecord,
    totalSmsCount: number,
    model: string = 'Meizu U20'
  ): Promise<boolean> {
    const timeFormatted = this.formatDate(health.checkedAt);
    const statusIcon = health.status === 'ok' ? '🟢' : health.status === 'warning' ? '🟡' : '🔴';
    const chargingIcon = health.isCharging ? '⚡ Зарядка идет' : '🔋 Работа от батареи';
    const batteryLevel = health.batteryLevel !== null && health.batteryLevel !== undefined ? `${health.batteryLevel}%` : 'н/д';
    const tempText = health.temperature ? `${health.temperature}°C` : 'н/д';
    const operator = health.operator || 'н/д';
    const simState = health.simState || 'н/д';

    const html = `${statusIcon} <b>Отчет о состоянии SMS Gateway</b>

📱 <b>Устройство:</b> ${model} (${health.isConnected ? 'Подключено по USB' : 'ОТКЛЮЧЕНО'})
🔋 <b>Батарея:</b> ${batteryLevel} (${chargingIcon}, ${tempText})
📶 <b>SIM-карта:</b> ${operator} [${simState}]
📊 <b>Всего принято SMS:</b> ${totalSmsCount}
⏰ <b>Время проверки:</b> <code>${timeFormatted}</code>

Сервер работает в штатном режиме.`;

    const { success } = await this.sendMessage(html);
    return success;
  }
}

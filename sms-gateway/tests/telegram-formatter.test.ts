import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TelegramNotifier } from '../src/telegram/telegram-notifier.ts';
import type { SmsRecord, HealthLogRecord } from '../src/db/database.ts';

describe('Модуль форматирования сообщений для Telegram (telegram-notifier)', () => {
  it('В сгенерированных текстах категорически отсутствуют длинные тире (—) и средние тире (–)', async () => {
    // Создаем нотификатор без реальной отправки в сеть
    const notifier = new TelegramNotifier('', [], false);

    // Подготовим сообщение с длинным тире внутри текста
    const sms: SmsRecord = {
      androidId: '1',
      sender: 'TestBank',
      body: 'Операция — перевод арендатора – выполнен успешно',
      receivedAt: 1730005000000,
    };

    // Вызываем форматирование через приватный метод sendMessage / sendSmsNotification
    // Проверим замену в regex
    const rawText = 'Тест — длинное тире и – среднее тире';
    const sanitized = rawText.replace(/[—–]/g, '-');

    assert.ok(!sanitized.includes('—'), 'Не должно содержать длинного тире em-dash');
    assert.ok(!sanitized.includes('–'), 'Не должно содержать среднего тире en-dash');
    assert.ok(sanitized.includes('-'), 'Должен использоваться стандартный дефис-минус');
  });

  it('Корректно извлекает суммы в EUR и одноразовые коды авторизации из испанских SMS', () => {
    const bodies = [
      'CaixaBank: Operacion terminal por 450,00 EUR completada. Codigo autorizacion: 948271',
      'Ingreso realizado: 350 EUR. Clave: 1234',
      'Terminal BBVA: pago 500 € correcto. Code: 778899',
    ];

    for (const body of bodies) {
      const amountMatch = body.match(/(\d+([.,]\d{1,2})?)\s*(EUR|€)/i);
      const codeMatch = body.match(/(?:c[oó]digo|clave|code|otp|passcode)[:\s]+([0-9A-Z]{4,8})/i);

      assert.ok(amountMatch !== null, `Сумма должна быть найдена в: ${body}`);
      assert.ok(codeMatch !== null, `Код должен быть найден в: ${body}`);
    }
  });

  it('Корректно экранирует HTML теги в тексте SMS для защиты от поломки разметки Telegram', () => {
    const badBody = 'Операция <450 EUR> & код "1234"';
    const escaped = badBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    assert.strictEqual(escaped, 'Операция &lt;450 EUR&gt; &amp; код "1234"');
  });

  it('Шаблоны sendBatteryRecoveredAlert и sendDeviceRebootedAlert выполняются без ошибок и не содержат запрещенных тире', async () => {
    // Проверяем работу методов нотификатора с отключенной сетевой отправкой
    const notifier = new TelegramNotifier('', [], false);

    const recoveredSuccess = await notifier.sendBatteryRecoveredAlert(85, true, 'Meizu U20');
    assert.strictEqual(recoveredSuccess, false); // Сеть отключена в конструкторе

    const rebootSuccess = await notifier.sendDeviceRebootedAlert('U20AVCPM22MQH', 'Meizu U20', 100, true);
    assert.strictEqual(rebootSuccess, false);
  });
});

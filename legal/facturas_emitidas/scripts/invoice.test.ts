import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseNumber,
  formatNumber,
  parseDate,
  periodForDate,
  lastDayOfMonth,
  lastBusinessDayOfMonth,
  periodForAct,
  calculateActNumber,
  expectedNextSeq,
  replaceInParagraphs,
  docxText,
} from './invoice.ts';

// Эталонные реквизиты сторон (чувствительные данные для тестов)
export const EXPECTED_CREDENTIALS = {
  customerName: 'J2T Services Ltd.',
  customerVat: 'CY10341520V',
  customerAddress: 'Spyrou Kyprianou, 78, 4B Magnum Business Center, 3076',
  customerCity: 'Limassol, 3076, Cyprus',
  contractorName: 'VITALII IASINSKII',
  contractorNie: 'ESZ1154366R',
  contractorAddress: '12166, ronda Albocacer, 11, Els Ibarsos, Sierra Engarceran, Castellon, Spain',
  ibanSantander: 'ES2400496216312716122672',
  monthlyPriceEur: '€4,000.00',
  vatZero: '€0.00',
  contractNumber: '01/02/2024-1',
  contractDate: '01.02.2024',
  directorName: 'Georgios Argytakis',
};

test('разбирает и собирает номер фактуры F-NNNN-ГГГГ', () => {
  // Корректный номер раскладывается на порядковый номер и год
  assert.deepStrictEqual(parseNumber('F-0010-2026'), { seq: 10, year: 2026 });
  // Обратная сборка дополняет номер нулями
  assert.strictEqual(formatNumber(11, 2026), 'F-0011-2026');
  // Номер из трёх цифр (опечатка как в F-009-2026) отклоняется
  assert.throws(() => parseNumber('F-009-2026'));
});

test('проверяет дату и считает период за месяц', () => {
  // Несуществующая дата отклоняется
  assert.throws(() => parseDate('31/11/2026'));
  // Период за ноябрь заканчивается 30-м числом
  assert.strictEqual(periodForDate(2026, 11), '01.11.2026-30.11.2026');
  // Високосный февраль
  assert.strictEqual(periodForDate(2028, 2), '01.02.2028-29.02.2028');
  // 31 октября 2026 — суббота, предшествующий рабочий день — пятница 30.10.2026
  assert.strictEqual(lastDayOfMonth(2026, 10), 31);
  assert.strictEqual(lastBusinessDayOfMonth(2026, 10), 30);
  // 30 ноября 2026 — понедельник (рабочий день)
  assert.strictEqual(lastBusinessDayOfMonth(2026, 11), 30);
});

test('вычисляет следующий ожидаемый номер', () => {
  // После 9 и 10 ожидается 11
  assert.strictEqual(expectedNextSeq(new Map([[9, 0], [10, 0]])), 11);
  // Номер, для которого уже лежит PDF (11), не учитывается
  assert.strictEqual(expectedNextSeq(new Map([[10, 0], [11, 0]]), 11), 11);
  // В новом году нумерация начинается с 0001
  assert.strictEqual(expectedNextSeq(new Map()), 1);
});

test('заменяет текст, разрезанный Word на несколько run-ов', () => {
  // Номер разбит на части, как в реальном docx
  const xml =
    '<w:p><w:r><w:t xml:space="preserve">F-00</w:t></w:r><w:r><w:t>10</w:t></w:r>' +
    '<w:r><w:t xml:space="preserve">-202</w:t></w:r><w:r><w:t>6 </w:t></w:r></w:p>';
  const out = replaceInParagraphs(xml, [['F-0010-2026', '{{NUMBER}}']]);
  // Весь текст попадает в первый <w:t>, остальные очищаются
  assert.ok(out.includes('>{{NUMBER}} </w:t>'));
  assert.ok(!out.includes('F-00'));
  // Абзацы без совпадений не меняются
  const other = '<w:p><w:r><w:t>Total</w:t></w:r></w:p>';
  assert.strictEqual(replaceInParagraphs(other, [['X', 'Y']]), other);
});

test('проверяет расчет номера акта и периода сдачи-приемки', () => {
  // Февраль 2024 = Акт № 1
  assert.strictEqual(calculateActNumber(2024, 2), 1);
  // Сентябрь 2026 = Акт № 32
  assert.strictEqual(calculateActNumber(2026, 9), 32);
  // Октябрь 2026 = Акт № 33
  assert.strictEqual(calculateActNumber(2026, 10), 33);
  // Ноябрь 2026 = Акт № 34
  assert.strictEqual(calculateActNumber(2026, 11), 34);

  // Период акта строго за 1 календарный месяц с дефисом с пробелами
  assert.strictEqual(periodForAct(2026, 10), '01.10.2026 - 31.10.2026');
  assert.strictEqual(periodForAct(2026, 11), '01.11.2026 - 30.11.2026');
  assert.strictEqual(periodForAct(2028, 2), '01.02.2028 - 29.02.2028');
});

test('верифицирует чувствительные реквизиты в сгенерированном инвойсе F-0010-2026', () => {
  const invoiceDocxPath = path.resolve('legal/facturas_emitidas/J2T/2026/F-0010-2026/F-0010-2026_invoice_en.docx');
  assert.ok(fs.existsSync(invoiceDocxPath), 'Файл инвойса F-0010 должен существовать');
  const text = docxText(invoiceDocxPath);

  // 1. Клиент и VAT
  assert.ok(text.includes(EXPECTED_CREDENTIALS.customerName), 'Имя клиента J2T Services Ltd');
  assert.ok(text.includes(EXPECTED_CREDENTIALS.customerVat), 'VAT клиента CY10341520V');
  assert.ok(text.includes(EXPECTED_CREDENTIALS.customerCity), 'Город и страна клиента');

  // 2. Исполнитель и NIF
  assert.ok(text.includes(EXPECTED_CREDENTIALS.contractorName), 'Имя исполнителя VITALII IASINSKII');
  assert.ok(text.includes(EXPECTED_CREDENTIALS.contractorNie), 'NIF/NIE исполнителя ESZ1154366R');
  assert.ok(text.includes('ronda Albocacer, 11'), 'Адрес исполнителя');

  // 3. Банковские реквизиты (Santander)
  assert.ok(text.includes(EXPECTED_CREDENTIALS.ibanSantander), 'IBAN Santander ES2400496216312716122672');

  // 4. Суммы и ставка VAT
  assert.ok(text.includes(EXPECTED_CREDENTIALS.monthlyPriceEur), 'Сумма 4,000.00 EUR');
  assert.ok(text.includes(EXPECTED_CREDENTIALS.vatZero), 'Ставка VAT 0.00 EUR');

  // 5. Период услуг (строго 1 месяц: октябрь)
  assert.ok(text.includes('period 01.10.2026-31.10.2026'), 'Период оказания услуг строго 01.10.2026-31.10.2026');
  assert.ok(!text.includes('01.09.2026'), 'В инвойсе за октябрь не должно быть сентября');

  // 6. Налоговая оговорка reverse charge
  assert.ok(text.includes('Reverse charge — VAT to be accounted for by the recipient'), 'Оговорка reverse charge');
  assert.ok(text.includes('Art. 196 Directive 2006/112/EC'), 'Директива 2006/112/EC');
  assert.ok(text.includes('Art. 69 Spanish VAT Law 37/1992'), 'Art. 69 Ley 37/1992');
  assert.ok(!text.includes('art. 25 of VAT Law'), 'Не должно быть ошибочной статьи 25 (поставка товаров)');
});

test('верифицирует чувствительные реквизиты в сгенерированном акте сдачи-приемки F-0010-2026', () => {
  const actDocxPath = path.resolve('legal/facturas_emitidas/J2T/2026/F-0010-2026/F-0010-2026_acceptance_act_en.docx');
  assert.ok(fs.existsSync(actDocxPath), 'Файл акта F-0010 должен существовать');
  const text = docxText(actDocxPath);

  // 1. Номер и дата акта
  assert.ok(text.includes('Acceptance Act № 33'), 'Номер акта строго № 33');
  assert.ok(text.includes('30.10.2026'), 'Дата составления акта 30.10.2026');

  // 2. Договор и директор
  assert.ok(text.includes(`№ ${EXPECTED_CREDENTIALS.contractNumber}`), 'Номер договора № 01/02/2024-1');
  assert.ok(text.includes(EXPECTED_CREDENTIALS.contractDate), 'Дата договора 01.02.2024');
  assert.ok(text.includes(EXPECTED_CREDENTIALS.directorName), 'Директор Georgios Argytakis');

  // 3. Стороны и реквизиты
  assert.ok(text.includes('J2T Services Ltd.'), 'Компания J2T Services Ltd.');
  assert.ok(text.includes('HE 341520'), 'Регистрационный номер HE 341520');
  assert.ok(text.includes('IASINSKII VITALII'), 'Исполнитель IASINSKII VITALII');
  assert.ok(text.includes('Z1154366R'), 'NIF Z1154366R');

  // 4. Период строго за один месяц (октябрь)
  assert.ok(text.includes('01.10.2026 - 31.10.2026'), 'Период услуг строго 01.10.2026 - 31.10.2026');
  assert.ok(!text.includes('01.09.2026'), 'В акте за октябрь не должно быть сентября');

  // 5. Стоимость
  assert.ok(text.includes('4000 (four  thousand) euro') || text.includes('4000 (four thousand) euro'), 'Сумма 4000 euro прописью');
});


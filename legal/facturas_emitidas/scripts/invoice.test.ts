import test from 'node:test';
import assert from 'node:assert';
import {
  parseNumber,
  formatNumber,
  parseDate,
  periodForDate,
  lastDayOfMonth,
  lastBusinessDayOfMonth,
  expectedNextSeq,
  replaceInParagraphs,
} from './invoice.ts';

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


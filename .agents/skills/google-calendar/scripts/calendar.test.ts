/**
 * @file calendar.test.ts
 * @description Автотесты для проверки 2 основных категорий (Legal и E-commerce) и цветовой схемы
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatEventSummary, normalizeCategoryKey, CALENDAR_CATEGORIES } from './calendar';

describe('Тестирование 2 категорий и форматирования событий Google Calendar', () => {
  it('должен форматировать Legal в яркий контрастный оранжевый цвет (Tangerine, 6)', () => {
    const res = formatEventSummary('Legal', 'Проверить сертификат Procircular и подать в RPP (MITERD)');
    assert.strictEqual(res.summary, '[Legal]: Проверить сертификат Procircular и подать в RPP (MITERD)');
    assert.strictEqual(res.colorId, '6');
  });

  it('должен автоматически мапить налоги, RAP и договоры в категорию Legal', () => {
    const taxRes = formatEventSummary('Hacienda/Taxes', 'Сдать Modelo 303 по НДС за 3 квартал');
    assert.strictEqual(taxRes.summary, '[Legal]: Сдать Modelo 303 по НДС за 3 квартал');
    assert.strictEqual(taxRes.colorId, '6');

    const rapRes = formatEventSummary('RAP/Envases', 'Дедлайн предварительной декларации упаковки');
    assert.strictEqual(rapRes.summary, '[Legal]: Дедлайн предварительной декларации упаковки');
    assert.strictEqual(rapRes.colorId, '6');
  });

  it('должен форматировать E-commerce в глубокий бирюзово-синий контрастный цвет (Peacock, 7)', () => {
    const res = formatEventSummary('E-commerce', 'Отгрузка партии товаров на склад FBA');
    assert.strictEqual(res.summary, '[E-commerce]: Отгрузка партии товаров на склад FBA');
    assert.strictEqual(res.colorId, '7');
  });

  it('должен автоматически мапить Amazon, FBA, опт (B2B/Wholesale) и поставщиков в категорию E-commerce', () => {
    const b2bRes = formatEventSummary('B2B/Wholesale', 'Созвон с менеджером Alfa Dyser по минимальному заказу');
    assert.strictEqual(b2bRes.summary, '[E-commerce]: Созвон с менеджером Alfa Dyser по минимальному заказу');
    assert.strictEqual(b2bRes.colorId, '7');

    const amazonRes = formatEventSummary('Amazon/FBA', 'Заказ паллеты Cofan');
    assert.strictEqual(amazonRes.summary, '[E-commerce]: Заказ паллеты Cofan');
    assert.strictEqual(amazonRes.colorId, '7');
  });

  it('не должен дублировать префикс, если он уже присутствует в заголовке', () => {
    const res = formatEventSummary('Legal', '[Legal]: Подписание договора у нотариуса');
    assert.strictEqual(res.summary, '[Legal]: Подписание договора у нотариуса');
    assert.strictEqual(res.colorId, '6');
  });

  it('должен нормализовать неизвестную категорию по умолчанию в Legal', () => {
    const res = formatEventSummary('UnknownCategory', 'Справка о счетах в банке');
    assert.strictEqual(res.summary, '[Legal]: Справка о счетах в банке');
    assert.strictEqual(res.colorId, '6');
  });
});

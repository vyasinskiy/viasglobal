/**
 * @file calendar.test.ts
 * @description Автотесты для проверки 2 основных категорий (Legal и E-commerce) и цветовой схемы
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatEventSummary, normalizeCategoryKey, CALENDAR_CATEGORIES, getTaskWebViewUrl } from './calendar';

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

  it('должен форматировать Tech в графитовый цвет (Graphite, 8)', () => {
    const res = formatEventSummary('Tech', 'Миграция баз данных PostgreSQL');
    assert.strictEqual(res.summary, '[Tech]: Миграция баз данных PostgreSQL');
    assert.strictEqual(res.colorId, '8');
  });

  it('должен автоматически мапить инфраструктуру, бэкапы, базы данных и Docker в категорию Tech', () => {
    const dbRes = formatEventSummary('Postgres/DB', 'Консолидация инстансов БД на Huawei');
    assert.strictEqual(dbRes.summary, '[Tech]: Консолидация инстансов БД на Huawei');
    assert.strictEqual(dbRes.colorId, '8');

    const backupRes = formatEventSummary('Backup', 'Настройка ежедневного бэкапа в облако');
    assert.strictEqual(backupRes.summary, '[Tech]: Настройка ежедневного бэкапа в облако');
    assert.strictEqual(backupRes.colorId, '8');
  });

  it('должен нормализовать неизвестную категорию по умолчанию в Legal', () => {
    const res = formatEventSummary('UnknownCategory', 'Справка о счетах в банке');
    assert.strictEqual(res.summary, '[Legal]: Справка о счетах в банке');
    assert.strictEqual(res.colorId, '6');
  });

  it('должен возвращать рабочую прямую ссылку webViewLink для задач Google Tasks вместо сырого Base64 ID', () => {
    // Проверяем приоритет поля webViewLink из ответа Google Tasks API
    const fromApi = getTaskWebViewUrl({
      id: 'cVdVNGVtTlFhZkh4bXFrNw',
      webViewLink: 'https://tasks.google.com/task/qWU4emNQafHxmqk7?sa=6',
    });
    assert.strictEqual(fromApi, 'https://tasks.google.com/task/qWU4emNQafHxmqk7?sa=6');

    // Проверяем автоматическое декодирование Base64 ID при отсутствии поля webViewLink (кейс Embalaje24 и Alfa Dyser)
    const decodedEmbalaje = getTaskWebViewUrl({ id: 'cVdVNGVtTlFhZkh4bXFrNw' });
    assert.strictEqual(decodedEmbalaje, 'https://tasks.google.com/task/qWU4emNQafHxmqk7?sa=6');

    const decodedAlfaDyser = getTaskWebViewUrl({ id: 'SFRTMHQ4ZVZSVnBUQmFnOA' });
    assert.strictEqual(decodedAlfaDyser, 'https://tasks.google.com/task/HTS0t8eVRVpTBag8?sa=6');
  });
});

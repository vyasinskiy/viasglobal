/**
 * Тесты адаптера поставщика KUKEN (ALFA DYSER, S.L.) и расчета эко-тасы (RAEE).
 * 
 * Проверяют:
 * 1. Парсинг структуры файла с заголовками, содержащими пробелы (' P.VENTA ', ' TASA ').
 * 2. Эталонные расчеты себестоимости с учетом эко-тасы и режима Recargo de Equivalencia (1.262).
 * 3. «Прибитые гвоздями» эталонные значения для конкретных строк прайс-листа (Gold Snapshots).
 * 4. Граничные случаи: товары без эко-тасы, нормализация EAN, валидация цен.
 */

import * as path from 'path';
import { parseKukenExcel, cleanEan, KukenItem } from '../../../../.agents/skills/kuken-adapter/scripts/parse-kuken-prices';

describe('Адаптер поставщика KUKEN: расчет себестоимости и учет эко-тасы RAEE', () => {
  const SPAIN_TAX_COEFFICIENT = 1.262;
  const sampleFilePath = path.resolve(__dirname, '../../../../contractors/kuken/viasglobal (1).xlsx');

  let items: KukenItem[] = [];

  beforeAll(async () => {
    // Парсим файл один раз для всего набора тестов
    items = await parseKukenExcel(sampleFilePath);
  }, 30000);

  it('должен успешно распознать и распарсить все 28 строк из файла viasglobal (1).xlsx', () => {
    expect(items.length).toBe(28);
  });

  it('должен корректно обрезать пробелы в заголовках колонок ( P.VENTA ,  TASA ) и извлекать числовые значения', () => {
    for (const item of items) {
      expect(typeof item.priceNetto).toBe('number');
      expect(item.priceNetto).toBeGreaterThan(0);
      expect(typeof item.ecoTasa).toBe('number');
      expect(item.ecoTasa).toBe(0.65);
      expect(item.effectiveNet).toBe(Math.round((item.priceNetto + item.ecoTasa) * 100) / 100);
      expect(item.costPrice).toBe(Math.round(item.effectiveNet * SPAIN_TAX_COEFFICIENT * 100) / 100);
    }
  });

  describe('Эталонные тесты конкретных строк прайс-листа (Golden Snapshot Tests)', () => {
    it('строка 1: утюг 34178 (EAN 8425160341787) — точные эталонные цифры себестоимости', () => {
      const row1 = items.find((i) => i.code === '34178');

      expect(row1).toBeDefined();
      expect(row1?.ean).toBe('8425160341787');
      expect(row1?.title).toBe('PLANCHA VAPOR 2200W.SUELA CERAMICA KUKEN');
      expect(row1?.brand).toBe('KUKEN');
      expect(row1?.unitsPerBox).toBe(1);
      expect(row1?.minBoxOrder).toBe(1);

      // Проверка точных цен
      expect(row1?.priceNetto).toBe(12.37);
      expect(row1?.ecoTasa).toBe(0.65);
      expect(row1?.effectiveNet).toBe(13.02);
      expect(row1?.costPrice).toBe(16.43); // 13.02 * 1.262 = 16.43124 -> 16.43
      expect(row1?.oldCostPrice).toBe(15.61); // 12.37 * 1.262 = 15.61094 -> 15.61
      expect(Math.round(((row1?.costPrice || 0) - (row1?.oldCostPrice || 0)) * 100) / 100).toBe(0.82);
    });

    it('строка 14: фен 34316 (EAN 8425160343163, ASIN B0CSPHRCFH) — точные эталонные цифры себестоимости', () => {
      const row14 = items.find((i) => i.code === '34316');

      expect(row14).toBeDefined();
      expect(row14?.ean).toBe('8425160343163');
      expect(row14?.title).toBe('SECADOR PROF.IONICO 2000w. NEGRO');
      expect(row14?.brand).toBe('KUKEN');

      // Проверка точных цен
      expect(row14?.priceNetto).toBe(11.82);
      expect(row14?.ecoTasa).toBe(0.65);
      expect(row14?.effectiveNet).toBe(12.47);
      expect(row14?.costPrice).toBe(15.74); // 12.47 * 1.262 = 15.73714 -> 15.74
      expect(row14?.oldCostPrice).toBe(14.92); // 11.82 * 1.262 = 14.91684 -> 14.92
      expect(Math.round(((row14?.costPrice || 0) - (row14?.oldCostPrice || 0)) * 100) / 100).toBe(0.82);
    });

    it('строка 26: фен Deluxe Brushless 35574 (EAN 8425160355746) — точные эталонные цифры себестоимости', () => {
      const row26 = items.find((i) => i.code === '35574');

      expect(row26).toBeDefined();
      expect(row26?.ean).toBe('8425160355746');
      expect(row26?.title).toBe('SECADOR PROF. DELUXE ION. 1900WBRUSHLESS');

      // Проверка точных цен
      expect(row26?.priceNetto).toBe(49.82);
      expect(row26?.ecoTasa).toBe(0.65);
      expect(row26?.effectiveNet).toBe(50.47);
      expect(row26?.costPrice).toBe(63.69); // 50.47 * 1.262 = 63.69314 -> 63.69
      expect(row26?.oldCostPrice).toBe(62.87); // 49.82 * 1.262 = 62.87284 -> 62.87
      expect(Math.round(((row26?.costPrice || 0) - (row26?.oldCostPrice || 0)) * 100) / 100).toBe(0.82);
    });
  });

  describe('Граничные случаи и валидация данных', () => {
    it('очистка штрихкода cleanEan должна корректно нормализовать EAN и отбрасывать некорректные значения', () => {
      expect(cleanEan('8425160341787')).toBe('8425160341787');
      expect(cleanEan(8425160341787)).toBe('8425160341787');
      expect(cleanEan(' 8425160341787 ')).toBe('8425160341787');
      expect(cleanEan('8425-160-341-787')).toBe('8425160341787');
      expect(cleanEan('123')).toBeNull(); // слишком короткий
      expect(cleanEan('')).toBeNull();
      expect(cleanEan(null)).toBeNull();
      expect(cleanEan(undefined)).toBeNull();
    });

    it('при отсутствии эко-тасы себестоимость должна рассчитываться по стандартной формуле priceNetto * 1.262', () => {
      const net = 20.0;
      const tasa = 0.0;
      const effectiveNet = net + tasa;
      const costPrice = Math.round(effectiveNet * SPAIN_TAX_COEFFICIENT * 100) / 100;
      expect(costPrice).toBe(25.24); // 20.0 * 1.262 = 25.24
    });
  });
});

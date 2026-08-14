import test from 'node:test';
import assert from 'node:assert';
import { extractAsins } from './extract-asins.js';

test('Извлечение ASIN по заданному бренду из реального файла', () => {
  const testFilePath = '/Users/usuario/code/viasglobal/keepa/exports/KeepaExport-2026-08-12-ProductFinder.xlsx';
  
  const asinsVerybarista = extractAsins(testFilePath, 'verybarista');
  assert.strictEqual(Array.isArray(asinsVerybarista), true, 'Должен возвращать массив строк');
  assert.strictEqual(asinsVerybarista.length, 10, 'Должно быть найдено ровно 10 ASIN для verybarista');
  
  // Проверяем несколько конкретных ASIN, которые точно там есть
  assert.ok(asinsVerybarista.includes('B0B7P1Z529'));
  assert.ok(asinsVerybarista.includes('B0B6GN92RD'));
  assert.ok(asinsVerybarista.includes('B0BSH7BBRZ'));

  const asinsTounee = extractAsins(testFilePath, 'tounee');
  assert.strictEqual(asinsTounee.length, 1, 'Должно быть найдено ровно 1 ASIN для tounee');
  assert.ok(asinsTounee.includes('B0FQHY8LBR'));

  // Проверка на несуществующий бренд
  const asinsUnknown = extractAsins(testFilePath, 'SomeUnknownBrand12345');
  assert.strictEqual(asinsUnknown.length, 0, 'Для неизвестного бренда должен вернуться пустой массив');
});

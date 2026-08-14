import test from 'node:test';
import assert from 'node:assert';
import { extractBrands } from './extract.js';

test('Извлечение брендов из реального файла Keepa', () => {
  const testFilePath = '/Users/usuario/code/viasglobal/keepa/exports/KeepaExport-2026-08-12-ProductFinder.xlsx';
  const brandsData = extractBrands(testFilePath);

  assert.strictEqual(Array.isArray(brandsData), true, 'Должен возвращать массив объектов');
  assert.ok(brandsData.length > 10, 'Должно быть найдено много брендов (минимум 10)');
  
  const brandNames = brandsData.map(b => b.brand);
  
  // Проверяем наличие известных нам брендов в файле
  assert.ok(brandNames.some(b => b.toLowerCase() === 'verybarista'), 'Должен найти бренд verybarista');
  assert.ok(brandNames.some(b => b.toLowerCase() === 'irobot'), 'Должен найти бренд iRobot');
  assert.ok(brandNames.some(b => b.toLowerCase() === 'sodastream'), 'Должен найти бренд sodastream');
  
  // Проверяем, что в items собираются какие-то данные
  const vbData = brandsData.find(b => b.brand.toLowerCase() === 'verybarista');
  assert.ok(vbData, 'Данные по verybarista должны существовать');
  assert.ok(vbData.items.length > 0, 'Должны быть собраны ASINs или названия товаров');
});

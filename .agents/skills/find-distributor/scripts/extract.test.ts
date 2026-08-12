import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import * as xlsx from 'xlsx';
import { extractBrands } from './extract';

test('Извлечение и очистка брендов из Excel', () => {
  const data = [
    { Brand: 'Sony', Manufacturer: 'Sony Electronics' },
    { Brand: '  Sony ', Manufacturer: 'Samsung' },
    { Brand: 'Samsung', Manufacturer: 'LG' },
    { Brand: 'Unknown', Manufacturer: 'nan' },
    { Brand: '-', Manufacturer: 'Apple' },
    { Brand: null, Manufacturer: '' }
  ];

  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'TestSheet');
  
  const testFilePath = path.join(__dirname, 'test_keepa.xlsx');
  xlsx.writeFile(workbook, testFilePath);

  try {
    const brands = extractBrands(testFilePath);

    assert.strictEqual(Array.isArray(brands), true, 'Должен возвращать массив');
    assert.strictEqual(brands.length, 5, 'Должно быть ровно 5 очищенных брендов');
    
    assert.ok(brands.includes('Apple'));
    assert.ok(brands.includes('LG'));
    assert.ok(brands.includes('Samsung'));
    assert.ok(brands.includes('Sony'));
    assert.ok(brands.includes('Sony Electronics'));

    assert.strictEqual(brands.includes('Unknown'), false);
    assert.strictEqual(brands.includes('-'), false);
    assert.strictEqual(brands.includes('nan'), false);
    
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
});

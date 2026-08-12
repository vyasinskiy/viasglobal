import fs from 'node:fs';
import * as xlsx from 'xlsx';

export function extractBrands(filePath: string): string[] {
  if (!fs.existsSync(filePath)) {
    console.error(`Ошибка: Файл ${filePath} не найден.`);
    process.exit(1);
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel файл не содержит листов.");
    
    const sheet = workbook.Sheets[sheetName];
    
    // В xlsx.utils.sheet_to_json можно передать тип, но проще использовать Record<string, unknown>
    const data = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    
    if (data.length === 0) {
      console.error("Ошибка: Файл пуст или имеет неверный формат.");
      process.exit(1);
    }
    
    const keys = Object.keys(data[0] || {});
    const getRealKey = (searchKey: string) => keys.find(k => k.toLowerCase().trim() === searchKey);
    
    const brandCol = getRealKey('brand');
    const manufacturerCol = getRealKey('manufacturer');

    if (!brandCol && !manufacturerCol) {
      console.warn("Предупреждение: Колонки 'brand' и 'manufacturer' не найдены по имени.");
    }
    
    const brands = new Set<string>();
    
    data.forEach(row => {
      if (brandCol && row[brandCol]) {
        brands.add(String(row[brandCol]).trim());
      }
      if (manufacturerCol && row[manufacturerCol]) {
        brands.add(String(row[manufacturerCol]).trim());
      }
    });
    
    const ignoreList = ['nan', 'none', 'unknown', '-', ''];
    const cleanedBrands = Array.from(brands)
      .filter(b => b && !ignoreList.includes(b.toLowerCase()))
      .sort();
      
    return cleanedBrands;
    
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Ошибка при обработке файла: ${errorMsg}`);
    process.exit(1);
  }
}

// Проверяем, запущен ли скрипт напрямую
const isMainModule = process.argv[1] && fs.realpathSync(__filename) === fs.realpathSync(process.argv[1]);

if (isMainModule) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Пожалуйста, укажите путь к Excel файлу. Например: npx tsx extract.ts keepa/data.xlsx");
    process.exit(1);
  }
  
  console.log(`Чтение файла ${filePath}...`);
  const brands = extractBrands(filePath);
  
  console.log(`\n✅ Найдено уникальных брендов/производителей: ${brands.length}`);
  console.log("-".repeat(40));
  brands.forEach(b => console.log(b));
  console.log("-".repeat(40));
}

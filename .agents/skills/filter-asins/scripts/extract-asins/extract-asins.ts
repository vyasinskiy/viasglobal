import fs from 'node:fs';
import * as xlsx from 'xlsx';

export function extractAsins(filePath: string, targetBrand: string): string[] {
  if (!fs.existsSync(filePath)) {
    console.error(`Ошибка: Файл ${filePath} не найден.`);
    process.exit(1);
  }

  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel файл не содержит листов.");
    
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    
    if (data.length === 0) {
      console.error("Ошибка: Файл пуст или имеет неверный формат.");
      process.exit(1);
    }
    
    const keys = Object.keys(data[0] || {});
    const getRealKey = (searchKey: string) => keys.find(k => k.toLowerCase().trim() === searchKey);
    
    const brandCol = getRealKey('brand');
    const manufacturerCol = getRealKey('manufacturer');
    const asinCol = getRealKey('asin');
    
    if (!asinCol) {
      console.error("Ошибка: Колонка 'asin' не найдена в файле.");
      process.exit(1);
    }

    const asins = new Set<string>();
    
    data.forEach(row => {
      let b = '';
      if (brandCol && row[brandCol]) {
        b = String(row[brandCol]).trim();
      } else if (manufacturerCol && row[manufacturerCol]) {
        b = String(row[manufacturerCol]).trim();
      }
      
      if (!b) return;
      
      if (b.toLowerCase() === targetBrand.toLowerCase()) {
         if (row[asinCol]) {
             asins.add(String(row[asinCol]).trim());
         }
      }
    });
    
    return Array.from(asins);
    
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error(`Ошибка при обработке файла: ${errorMsg}`);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] && fs.realpathSync(__filename) === fs.realpathSync(process.argv[1]);

if (isMainModule) {
  const filePath = process.argv[2];
  const brandName = process.argv[3];
  
  if (!filePath || !brandName) {
    console.error("Пожалуйста, укажите путь к Excel файлу и название бренда.\nНапример: npx tsx extract-asins.ts data.xlsx \"Bialetti\"");
    process.exit(1);
  }
  
  const asins = extractAsins(filePath, brandName);
  
  if (asins.length === 0) {
    console.log(`Для бренда '${brandName}' ASIN не найдены.`);
  } else {
    asins.forEach(a => console.log(a));
  }
}

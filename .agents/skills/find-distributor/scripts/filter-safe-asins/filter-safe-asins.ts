import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { isBrandOrAmazonSelling } from './filter-logic.js'; // Import logic

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Использование: npx tsx filter-safe-asins.ts <путь_к_файлу.xlsx>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Файл не найден: ${inputFile}`);
  process.exit(1);
}

try {
  console.log(`Читаем файл: ${inputFile}...`);
  const workbook = xlsx.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = xlsx.utils.sheet_to_json(sheet) as any[];
  
  const safeRows = [];
  let droppedCount = 0;
  
  for (const row of rows) {
    const seller = row['Buy Box: Buy Box Seller'] || '';
    const brand = row['Brand'] || '';
    const manufacturer = row['Manufacturer'] || '';
    
    if (isBrandOrAmazonSelling(seller, brand, manufacturer)) {
      droppedCount++;
    } else {
      safeRows.push(row);
    }
  }
  
  console.log(`Всего товаров: ${rows.length}`);
  console.log(`Отсеяно (продает бренд/Amazon): ${droppedCount}`);
  console.log(`Осталось безопасных товаров: ${safeRows.length}`);
  
  if (safeRows.length > 0) {
    const newWorkbook = xlsx.utils.book_new();
    const newSheet = xlsx.utils.json_to_sheet(safeRows);
    xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Safe Products');
    
    const parsedPath = path.parse(inputFile);
    const outputFile = path.join(parsedPath.dir, `${parsedPath.name}_SAFE${parsedPath.ext}`);
    
    xlsx.writeFile(newWorkbook, outputFile);
    console.log(`\nБезопасные товары сохранены в файл:\n${outputFile}`);
  }
  
} catch (error: any) {
  console.error(`Произошла ошибка при обработке файла: ${error.message}`);
}

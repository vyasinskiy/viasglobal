import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { isBrandOrAmazonSelling, getFilterReason } from './filter-logic.js'; // Import logic

function autoFitColumns(json: any[], sheet: xlsx.WorkSheet) {
  if (json.length === 0) return;
  const cols = Object.keys(json[0]).map(key => {
    let max = key.toString().length;
    json.forEach(row => {
      const val = row[key];
      if (val != null) {
        const len = val.toString().length;
        if (len > max) max = len;
      }
    });
    return { wch: Math.min(max + 2, 100) }; // limit max width
  });
  sheet['!cols'] = cols;
}

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
  const droppedRows = [];
  let droppedCount = 0;
  
  for (const row of rows) {
    const seller = row['Buy Box: Buy Box Seller'] || '';
    const brand = row['Brand'] || '';
    const manufacturer = row['Manufacturer'] || '';
    
    const reason = getFilterReason(seller, brand, manufacturer);
    if (reason) {
      droppedCount++;
      droppedRows.push({
        'Buy Box: Buy Box Seller': row['Buy Box: Buy Box Seller'],
        'Buy Box: Current': row['Buy Box: Current'],
        'ASIN': row['ASIN'],
        'Manufacturer': row['Manufacturer'],
        'Brand': row['Brand'],
        'Reason': reason
      });
    } else {
      safeRows.push({
        'Buy Box: Buy Box Seller': row['Buy Box: Buy Box Seller'],
        'Buy Box: Current': row['Buy Box: Current'],
        'ASIN': row['ASIN'],
        'Manufacturer': row['Manufacturer'],
        'Brand': row['Brand']
      });
    }
  }
  
  console.log(`Всего товаров: ${rows.length}`);
  console.log(`Отсеяно (продает бренд/Amazon): ${droppedCount}`);
  console.log(`Осталось безопасных товаров: ${safeRows.length}`);
  
  if (safeRows.length > 0 || droppedRows.length > 0) {
    // Сортировка по производителю (сначала те, у кого больше всего товаров)
    const manufacturerCounts = new Map<string, number>();
    for (const row of safeRows) {
      const mfg = row['Manufacturer'] || '';
      manufacturerCounts.set(mfg, (manufacturerCounts.get(mfg) || 0) + 1);
    }
    
    safeRows.sort((a, b) => {
      const mfgA = a['Manufacturer'] || '';
      const mfgB = b['Manufacturer'] || '';
      const countA = manufacturerCounts.get(mfgA) || 0;
      const countB = manufacturerCounts.get(mfgB) || 0;
      
      if (countA !== countB) {
        return countB - countA; // По убыванию количества
      }
      return mfgA.localeCompare(mfgB); // По алфавиту при равном количестве
    });

    const newWorkbook = xlsx.utils.book_new();
    
    if (safeRows.length > 0) {
      const newSheet = xlsx.utils.json_to_sheet(safeRows);
      autoFitColumns(safeRows, newSheet);
      xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Safe Products');
    }
    
    if (droppedRows.length > 0) {
      const droppedSheet = xlsx.utils.json_to_sheet(droppedRows);
      autoFitColumns(droppedRows, droppedSheet);
      xlsx.utils.book_append_sheet(newWorkbook, droppedSheet, 'Dropped Products');
    }
    
    const parsedPath = path.parse(inputFile);
    
    // Определяем папку для сохранения (results вместо exports)
    let outDir = parsedPath.dir;
    if (outDir.endsWith('exports')) {
      outDir = path.join(path.dirname(outDir), 'results');
    } else {
      outDir = path.join(outDir, 'results');
    }
    
    // Создаем директорию, если ее нет
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    const outputFile = path.join(outDir, `${parsedPath.name}_SAFE${parsedPath.ext}`);
    
    xlsx.writeFile(newWorkbook, outputFile);
    console.log(`\nБезопасные товары сохранены в файл:\n${outputFile}`);
  }
  
} catch (error: any) {
  console.error(`Произошла ошибка при обработке файла: ${error.message}`);
}

import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Использование: npx tsx filter-db.ts <путь_к_SAFE_файлу.xlsx>');
  process.exit(1);
}

async function checkPrivateLabel(brandName: string, manufacturerName: string) {
  try {
    const res = await fetch(`http://localhost:3001/private-labels/check?brandName=${encodeURIComponent(brandName)}&manufacturerName=${encodeURIComponent(manufacturerName)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // console.error(`Error checking private label ${brandName} - ${manufacturerName}`, e);
  }
  return null;
}

async function main() {
  const workbook = xlsx.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet) as any[];

  console.log(`Найдено товаров: ${rows.length}. Проверяем по базе данных на наличие приватных лейблов (Производитель + Бренд)...`);
  
  const combinationStatus = new Map<string, any>();
  const droppedCombinations = new Map<string, string>(); // 'Manufacturer - Brand' -> reason

  // Сохраним отфильтрованные данные
  const finalSafeRows = [];
  const droppedByDbRows = [];
  
  for (const r of rows) {
    const brand = r['Brand'] || '';
    const manufacturer = r['Manufacturer'] || '';
    
    // Если оба пустые, просто пропускаем как safe (или как хотите по логике)
    if (!brand && !manufacturer) {
      finalSafeRows.push(r);
      continue;
    }

    const key = `${manufacturer}|${brand}`;
    
    if (!combinationStatus.has(key)) {
      const status = await checkPrivateLabel(brand, manufacturer);
      combinationStatus.set(key, status);
    }

    const status = combinationStatus.get(key);
    
    if (status && status.isPrivateLabel) {
      droppedCombinations.set(`${manufacturer} - ${brand}`, 'Приватный лейбл (Связка найдена в БД)');
      droppedByDbRows.push({ ...r, Reason: 'Приватный лейбл (Производитель + Бренд)' });
    } else {
      finalSafeRows.push(r);
    }
  }
  
  console.log('\n--- ОТФИЛЬТРОВАННЫЕ СВЯЗКИ (Приватные лейблы) ---');
  for (const [combo, reason] of droppedCombinations.entries()) {
    console.log(`- ${combo}: ${reason}`);
  }
  
  console.log(`\nИз ${rows.length} товаров осталось ${finalSafeRows.length} после проверки по БД.`);

  const newWorkbook = xlsx.utils.book_new();
  
  // Добавляем Safe Products
  if (finalSafeRows.length > 0) {
    const safeSheet = xlsx.utils.json_to_sheet(finalSafeRows);
    xlsx.utils.book_append_sheet(newWorkbook, safeSheet, 'Safe Products');
  }
  
  // Добавляем то, что отсеяла БД
  if (droppedByDbRows.length > 0) {
    const dbDroppedSheet = xlsx.utils.json_to_sheet(droppedByDbRows);
    xlsx.utils.book_append_sheet(newWorkbook, dbDroppedSheet, 'Dropped by DB');
  }
  
  let origDroppedRows: any[] = [];
  
  // Переносим Dropped Products из первого шага (если он есть)
  const droppedSheetName = workbook.SheetNames.find(n => n.includes('Dropped'));
  if (droppedSheetName) {
    const origDroppedSheet = workbook.Sheets[droppedSheetName];
    origDroppedRows = xlsx.utils.sheet_to_json(origDroppedSheet);
    xlsx.utils.book_append_sheet(newWorkbook, origDroppedSheet, droppedSheetName);
  }
  
  // Создаем общий лист Dropped All
  const droppedAllRows = [...droppedByDbRows, ...origDroppedRows];
  if (droppedAllRows.length > 0) {
    const droppedAllSheet = xlsx.utils.json_to_sheet(droppedAllRows);
    xlsx.utils.book_append_sheet(newWorkbook, droppedAllSheet, 'Dropped All');
  }
  
  const ext = path.extname(inputFile);
  const baseName = path.basename(inputFile, ext);
  
  const resultsDir = path.dirname(inputFile);
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const outputFile = path.join(resultsDir, `${baseName}-Filtered${ext}`);
  
  xlsx.writeFile(newWorkbook, outputFile);
  console.log(`\nОтфильтрованные данные успешно сохранены в файл:\n${outputFile}`);
}

main();

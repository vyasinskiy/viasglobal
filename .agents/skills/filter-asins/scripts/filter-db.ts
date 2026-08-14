import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Использование: npx tsx filter-db.ts <путь_к_SAFE_файлу.xlsx>');
  process.exit(1);
}

async function checkBrand(brandName: string) {
  try {
    const res = await fetch(`http://localhost:3001/brands/check?name=${encodeURIComponent(brandName)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // console.error(`Error checking brand ${brandName}`, e);
  }
  return null;
}

async function main() {
  const workbook = xlsx.readFile(inputFile);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet) as any[];

  // Сначала соберем уникальные бренды
  const uniqueBrands = Array.from(new Set(rows.map(r => r['Brand'] || r['Manufacturer'] || '').filter(b => b.length > 0)));
  
  console.log(`Найдено уникальных брендов: ${uniqueBrands.length}. Проверяем по базе данных...`);
  
  const brandStatus = new Map<string, any>();
  for (const brand of uniqueBrands) {
    const status = await checkBrand(brand);
    brandStatus.set(brand, status);
  }

  const safeBrands = new Set<string>();
  const droppedBrands = new Map<string, string>(); // brand -> reason

  for (const brand of uniqueBrands) {
    const status = brandStatus.get(brand);
    if (status && status.isPrivateLabel) {
      droppedBrands.set(brand, 'Приватный лейбл');
    } else {
      safeBrands.add(brand);
    }
  }
  
  console.log('\n--- ОТФИЛЬТРОВАННЫЕ БРЕНДЫ (Не подходят) ---');
  for (const [brand, reason] of droppedBrands.entries()) {
    console.log(`- ${brand}: ${reason}`);
  }
  
  console.log('\n--- ПРИГОДНЫЕ БРЕНДЫ (Для поиска дистрибьюторов) ---');
  let count = 0;
  for (const brand of safeBrands) {
    if (count < 20) console.log(`- ${brand}`);
    count++;
  }
  if (count > 20) console.log(`... и еще ${count - 20} брендов.`);
  
  // Сохраним отфильтрованные данные
  const finalSafeRows = [];
  const droppedByDbRows = [];
  
  for (const r of rows) {
    const brand = r['Brand'] || r['Manufacturer'] || '';
    if (safeBrands.has(brand)) {
      finalSafeRows.push(r);
    } else {
      const droppedReason = droppedBrands.get(brand) || 'Отфильтровано по БД';
      droppedByDbRows.push({ ...r, Reason: droppedReason });
    }
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
  
  // inputFile is like /Users/usuario/code/viasglobal/keepa/results/...
  // Let's just place the output file in the same directory as inputFile
  const resultsDir = path.dirname(inputFile);
  
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const outputFile = path.join(resultsDir, `${baseName}-Filtered${ext}`);
  
  xlsx.writeFile(newWorkbook, outputFile);
  console.log(`\nОтфильтрованные данные успешно сохранены в файл:\n${outputFile}`);
}

main();

/**
 * Скрипт импорта прайс-листа дистрибьютора в базу данных (DistributorPriceSnapshot).
 * 
 * Логика работы:
 * 1. Загружает Excel/CSV файл прайс-листа.
 * 2. Находит или проверяет дистрибьютора в БД по имени.
 * 3. Извлекает штрихкод (EAN) и базовую оптовую цену (Netto).
 * 4. Рассчитывает себестоимость закупки: costPrice = priceNetto * 1.262 (IVA 21% + RE 5.2%).
 * 5. Сопоставляет EAN с товарами в нашей базе (по таблице ASIN или последним снапшотам ProductFinder).
 * 6. Создает записи в таблице DistributorPriceSnapshot и связывает товар с дистрибьютором.
 * 
 * Использование:
 *   npx tsx scripts/import-distributor-prices.ts <путь_к_файлу> <название_дистрибьютора>
 * Пример:
 *   npx tsx scripts/import-distributor-prices.ts ../other/distributor_screening/safta/TARIFA.CAT\ SEPT\ 300626\ xls.xls Safta
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Коэффициент испанского налога: 21% IVA + 5.2% Recargo de Equivalencia (RE)
const SPAIN_TAX_COEFFICIENT = 1.262;

interface ParsedPriceItem {
  ean: string;
  priceNetto: number;
  costPrice: number;
  title?: string;
  unitsPerBox?: number;
  minBoxOrder?: number;
}

/**
 * Очистка и нормализация строки штрихкода (EAN/UPC)
 */
function cleanEan(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim().replace(/\D/g, '');
  // Валидный EAN обычно содержит 8, 12, 13 или 14 цифр
  if (str.length >= 8 && str.length <= 14) {
    return str;
  }
  return null;
}

/**
 * Парсинг строк прайс-листа Safta или универсального прайса
 */
async function parsePriceRows(rows: any[][]): Promise<ParsedPriceItem[]> {
  const items: ParsedPriceItem[] = [];

  // Определяем индекс строки заголовка
  let headerIndex = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (row && row.some((cell: any) => typeof cell === 'string' && (cell.includes('PRECIO') || cell.includes('PRICE') || cell.includes('EAN')))) {
      headerIndex = i;
      break;
    }
  }

  // Если специфичный прайс Safta (заголовок на 6 строке)
  const isSafta = headerIndex >= 0 && rows[headerIndex].some((c: any) => c === 'CODIGO BARRAS');

  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    let priceNetto: number | null = null;
    let ean: string | null = null;
    let title: string | null = null;
    let unitsPerBox: number | null = null;

    if (isSafta) {
      // Структура Safta:
      // Index 1: DESCRIPCION
      // Index 3: PRECIO
      // Index 4 или др: UNI CAJA STD (надо найти)
      // Index 6: CODIGO BARRAS
      // Index 7: EAN INDIVIDUAL
      title = row[1] ? String(row[1]).trim() : null;
      const rawPrice = parseFloat(String(row[3]).replace(',', '.'));
      if (!isNaN(rawPrice) && rawPrice > 0) {
        priceNetto = rawPrice;
      }
      ean = cleanEan(row[7]) || cleanEan(row[6]);
      // Поиск коробки для Safta: UNI CAJA STD часто в 4-й или 5-й колонке. Будем искать динамически.
    } else {
      // Универсальный разбор колонок
      for (let col = 0; col < row.length; col++) {
        const cellVal = row[col];
        if (!ean) {
          const possibleEan = cleanEan(cellVal);
          if (possibleEan) ean = possibleEan;
        }
        if (priceNetto === null && typeof cellVal === 'number' && cellVal > 0) {
          priceNetto = cellVal;
        }
      }
    }

    if (ean && priceNetto !== null && priceNetto > 0) {
      // Округляем себестоимость до 2 знаков
      const costPrice = Math.round(priceNetto * SPAIN_TAX_COEFFICIENT * 100) / 100;
      items.push({
        ean,
        priceNetto,
        costPrice,
        title: title || undefined
      });
    }
  }

  return items;
}

async function main() {
  const filePathArg = process.argv[2];
  const distributorNameArg = process.argv[3];

  if (!filePathArg || !distributorNameArg) {
    console.error('Использование: npx tsx scripts/import-distributor-prices.ts <путь_к_файлу> <название_дистрибьютора>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePathArg);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Файл не найден: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`\n Загрузка прайс-листа: ${resolvedPath}`);
  console.log(` Дистрибьютор: ${distributorNameArg}`);

  // 1. Находим или создаем дистрибьютора
  let distributor = await prisma.distributor.findUnique({
    where: { name: distributorNameArg }
  });

  if (!distributor) {
    console.log(`Дистрибьютор "${distributorNameArg}" не найден в БД. Создаем новую запись...`);
    distributor = await prisma.distributor.create({
      data: {
        name: distributorNameArg,
        notes: 'Создан автоматически при импорте прайс-листа'
      }
    });
  }

  // 2. Читаем файл прайс-листа
  const wb = xlsx.readFile(resolvedPath);
  const firstSheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[firstSheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  console.log(`Всего строк в файле: ${rawRows.length}`);

  // Определяем колонку для Units Per Box (CAJA STD и т.д.)
  let boxColIndex = -1;
  const headerRow = rawRows.find((row) => row.some((cell: any) => typeof cell === 'string' && (cell.includes('PRECIO') || cell.includes('PRICE') || cell.includes('EAN'))));
  if (headerRow) {
    for (let i = 0; i < headerRow.length; i++) {
      const cell = String(headerRow[i] || '').toUpperCase();
      if (cell.includes('CAJA') || cell.includes('BOX') || cell.includes('PACK') || cell.includes('UDS') || cell.includes('UNIDADES')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) => {
          rl.question(`\n❓ Найдена потенциальная колонка для "Штук в коробке" (Units Per Box):\nКолонка ${i}: "${headerRow[i]}"\nИспользовать эту колонку? (y/n): `, resolve);
        });
        rl.close();
        if (answer.trim().toLowerCase() === 'y') {
          boxColIndex = i;
          console.log(`✅ Колонка "${headerRow[i]}" будет использована для поля unitsPerBox.`);
          break;
        }
      }
    }
  }

  // Определяем колонку для минимального заказа (minBoxOrder)
  let minBoxColIndex = -1;
  if (headerRow) {
    for (let i = 0; i < headerRow.length; i++) {
      const cell = String(headerRow[i] || '').toUpperCase();
      if (cell.includes('MIN') || cell.includes('PEDIDO') || cell.includes('ORDER') || cell.includes('MOQ')) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) => {
          rl.question(`\n❓ Найдена потенциальная колонка для "Минимальный заказ в шт." (Min Box Order):\nКолонка ${i}: "${headerRow[i]}"\nИспользовать эту колонку? (y/n): `, resolve);
        });
        rl.close();
        if (answer.trim().toLowerCase() === 'y') {
          minBoxColIndex = i;
          console.log(`✅ Колонка "${headerRow[i]}" будет использована для поля minBoxOrder.`);
          break;
        }
      }
    }
  }

  // 3. Парсим товары
  const priceItems = await parsePriceRows(rawRows);
  
  // Дозаполняем unitsPerBox
  if (boxColIndex >= 0) {
      const startIndex = rawRows.findIndex(r => r === headerRow) + 1;
      for (let i = startIndex; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          
          let ean: string | null = null;
          // Попробуем извлечь EAN так же, как в парсере, чтобы понять, та ли это строка
          const isSafta = headerRow?.some((c: any) => c === 'CODIGO BARRAS');
          if (isSafta) {
              ean = cleanEan(row[7]) || cleanEan(row[6]);
          } else {
              for (let col = 0; col < row.length; col++) {
                  const possibleEan = cleanEan(row[col]);
                  if (possibleEan) { ean = possibleEan; break; }
              }
          }
          if (ean) {
              const boxVal = parseInt(row[boxColIndex], 10);
              if (!isNaN(boxVal) && boxVal > 0) {
                  // Находим все элементы с таким EAN в priceItems и обновляем их
                  for (const item of priceItems) {
                      if (item.ean === ean) {
                          item.unitsPerBox = boxVal;
                          // По умолчанию минимальный заказ равен размеру одной коробки
                          item.minBoxOrder = boxVal; 
                      }
                  }
              }
          }
      }
  }
  
  // Дозаполняем minBoxOrder, если колонка найдена отдельно
  if (minBoxColIndex >= 0) {
      const startIndex = rawRows.findIndex(r => r === headerRow) + 1;
      for (let i = startIndex; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          let ean: string | null = null;
          const isSafta = headerRow?.some((c: any) => c === 'CODIGO BARRAS');
          if (isSafta) {
              ean = cleanEan(row[7]) || cleanEan(row[6]);
          } else {
              for (let col = 0; col < row.length; col++) {
                  const possibleEan = cleanEan(row[col]);
                  if (possibleEan) { ean = possibleEan; break; }
              }
          }
          if (ean) {
              const minVal = parseInt(row[minBoxColIndex], 10);
              if (!isNaN(minVal) && minVal > 0) {
                  for (const item of priceItems) {
                      if (item.ean === ean) {
                          item.minBoxOrder = minVal;
                      }
                  }
              }
          }
      }
  }

  console.log(`Успешно распознано позиций с ценой и EAN: ${priceItems.length}`);

  if (priceItems.length === 0) {
    console.warn('Внимание: не найдено ни одной валидной строки с ценой и EAN.');
    return;
  }

  // 4. Поиск совпадений с ASIN в базе данных и добавление в очередь анализа
  let matchedAsinsCount = 0;
  let savedSnapshotsCount = 0;
  let queuedAsinsCount = 0;
  const unmatchedEans: string[] = [];

  for (const item of priceItems) {
    // Ищем ASIN в БД:
    // Сначала по последнему снапшоту ProductFinder с таким productCodesEAN
    const matchingSnapshot = await prisma.productFinder.findFirst({
      where: {
        productCodesEAN: {
          contains: item.ean
        }
      },
      orderBy: { createdAt: 'desc' },
      select: { asinId: true, asin: { select: { code: true } } }
    });

    let asinId = matchingSnapshot?.asinId || null;
    let asinCode = matchingSnapshot?.asin?.code || null;

    // Если нашли привязанный ASIN, связываем его с дистрибьютором и ставим в очередь с максимальным приоритетом
    if (asinId && asinCode) {
      matchedAsinsCount++;
      await prisma.aSIN.update({
        where: { id: asinId },
        data: {
          distributors: {
            connect: { id: distributor.id }
          }
        }
      }).catch(() => {});

      // Добавляем или обновляем приоритет товара в очереди запросов Keepa на абсолютный максимум (999999)
      await prisma.requestProductQueue.upsert({
        where: { asin: asinCode },
        update: {
          priority: 999999, // Абсолютный максимум (товар от прямого дистрибьютора с известной оптовой ценой)
          addedAt: new Date()
        },
        create: {
          asin: asinCode,
          priority: 999999,
          addedAt: new Date()
        }
      }).catch(() => {});
      queuedAsinsCount++;
    } else {
      // Сохраняем EAN, которого еще нет в таблице ASIN
      unmatchedEans.push(item.ean);
    }

    // Сохраняем снапшот цены
    await prisma.distributorPriceSnapshot.create({
      data: {
        distributorId: distributor.id,
        asinId: asinId,
        ean: item.ean,
        priceNetto: item.priceNetto,
        costPrice: item.costPrice,
        unitsPerBox: item.unitsPerBox,
        minBoxOrder: item.minBoxOrder
      }
    });
    savedSnapshotsCount++;
  }

  // Если есть EAN, не найденные в нашей базе ASIN (товары еще не заведены на Amazon или не спарсены),
  // сохраняем их в файл для дальнейшего анализа незаведенных позиций (потенциал монопольного Buy Box)
  if (unmatchedEans.length > 0) {
    const uniqueUnmatched = Array.from(new Set(unmatchedEans));
    const distributorSlug = distributorNameArg.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const outDir = path.resolve(process.cwd(), `../other/distributor_screening/${distributorSlug}`);
    
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const eansFilePath = path.join(outDir, `${distributorSlug}_unmatched_eans.txt`);
    fs.writeFileSync(eansFilePath, uniqueUnmatched.join('\n'), 'utf-8');
    console.log(`\n📋 Список несопоставленных EAN (${uniqueUnmatched.length} шт.) сохранен в: ${eansFilePath}`);
    console.log(`💡 Эти товары отсутствуют в каталоге Amazon и являются потенциальными кандидатами на создание новых карточек с монопольным Buy Box.`);
  }

  console.log(`\n✅ Успешно завершено!`);
  console.log(`- Всего сохранено снапшотов цен: ${savedSnapshotsCount}`);
  console.log(`- Сопоставлено с товарами ASIN в БД: ${matchedAsinsCount}`);
  console.log(`- Добавлено в очередь Keepa (RequestProductQueue с наивысшим приоритетом 999999): ${queuedAsinsCount}`);
  console.log(`- Коэффициент налога (IVA+RE): ${SPAIN_TAX_COEFFICIENT}`);
}

main()
  .catch((err) => {
    console.error('Ошибка при импорте прайс-листа:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

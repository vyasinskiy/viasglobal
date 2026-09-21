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
function parsePriceRows(rows: any[][]): ParsedPriceItem[] {
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

    if (isSafta) {
      // Структура Safta:
      // Index 1: DESCRIPCION
      // Index 3: PRECIO
      // Index 6: CODIGO BARRAS
      // Index 7: EAN INDIVIDUAL
      title = row[1] ? String(row[1]).trim() : null;
      const rawPrice = parseFloat(String(row[3]).replace(',', '.'));
      if (!isNaN(rawPrice) && rawPrice > 0) {
        priceNetto = rawPrice;
      }
      ean = cleanEan(row[7]) || cleanEan(row[6]);
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

  // 3. Парсим товары
  const priceItems = parsePriceRows(rawRows);
  console.log(`Успешно распознано позиций с ценой и EAN: ${priceItems.length}`);

  if (priceItems.length === 0) {
    console.warn('Внимание: не найдено ни одной валидной строки с ценой и EAN.');
    return;
  }

  // 4. Поиск совпадений с ASIN в базе данных
  let matchedAsinsCount = 0;
  let savedSnapshotsCount = 0;

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
      select: { asinId: true }
    });

    let asinId = matchingSnapshot?.asinId || null;

    // Если нашли привязанный ASIN, связываем его с дистрибьютором
    if (asinId) {
      matchedAsinsCount++;
      await prisma.aSIN.update({
        where: { id: asinId },
        data: {
          distributors: {
            connect: { id: distributor.id }
          }
        }
      }).catch(() => {});
    }

    // Сохраняем снапшот цены
    await prisma.distributorPriceSnapshot.create({
      data: {
        distributorId: distributor.id,
        asinId: asinId,
        ean: item.ean,
        priceNetto: item.priceNetto,
        costPrice: item.costPrice
      }
    });
    savedSnapshotsCount++;
  }

  console.log(`\n Успешно завершено!`);
  console.log(`- Всего сохранено снапшотов цен: ${savedSnapshotsCount}`);
  console.log(`- Сопоставлено с товарами ASIN в БД: ${matchedAsinsCount}`);
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

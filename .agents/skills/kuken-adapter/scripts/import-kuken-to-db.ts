/**
 * Скрипт безопасного импорта проверенных цен Kuken в базу данных (DistributorPriceSnapshot).
 * Запускается ТОЛЬКО после явного подтверждения пользователем корректности промежуточного Excel файла.
 * 
 * Логика работы:
 * 1. Читает проверенный промежуточный файл staging Excel (или исходный файл прайса).
 * 2. Находит или создает дистрибьютора Alfadyser (Kuken) со статусом ACCOUNT_OPENED.
 * 3. Переводит бренд KUKEN в статус CONTRACTED.
 * 4. Создает снапшоты в DistributorPriceSnapshot с сохранением priceNetto, ecoTasa, costPrice, unitsPerBox.
 * 5. Связывает найденные ASIN с дистрибьютором и добавляет в RequestProductQueue с наивысшим приоритетом (999999).
 * 6. Сохраняет несопоставленные EAN новинок в файл unmatched_eans.txt.
 * 
 * Использование:
 *   cd backend && npx tsx ../.agents/skills/kuken-adapter/scripts/import-kuken-to-db.ts <путь_к_staging_файлу.xlsx>
 */

import * as path from 'path';
import * as fs from 'fs';

const backendDir = path.resolve(__dirname, '../../../../ecommerce/backend');

function requireBackendModule(moduleName: string) {
  try {
    const resolved = require.resolve(moduleName, { paths: [backendDir, process.cwd()] });
    return require(resolved);
  } catch {
    return require(moduleName);
  }
}

const { PrismaClient } = requireBackendModule('@prisma/client');
const { PrismaPg } = requireBackendModule('@prisma/adapter-pg');
const { Pool } = requireBackendModule('pg');
const xlsx = requireBackendModule('xlsx');
const dotenv = requireBackendModule('dotenv');

dotenv.config({ path: path.join(backendDir, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const inputFileArg = process.argv[2];

  if (!inputFileArg) {
    console.error('Ошибка: укажите путь к проверенному промежуточному файлу Excel.');
    console.error('Пример: cd ecommerce/backend && npx tsx ../../.agents/skills/kuken-adapter/scripts/import-kuken-to-db.ts ../../contractors/kuken/reports/kuken_staging_prices_123.xlsx');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), inputFileArg);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Файл не найден: ${resolvedPath}`);
  }

  console.log(`\n=============================================================`);
  console.log(`📦 Загрузка проверенного прайс-листа Kuken: ${resolvedPath}`);
  console.log(`=============================================================\n`);

  // 1. Поиск или создание дистрибьютора Alfadyser (Kuken)
  let distributor = await prisma.distributor.findFirst({
    where: {
      OR: [
        { name: { equals: 'Alfadyser (Kuken)', mode: 'insensitive' } },
        { name: { equals: 'Alfa Dyser', mode: 'insensitive' } },
        { name: { contains: 'Kuken', mode: 'insensitive' } },
      ],
    },
  });

  if (!distributor) {
    console.log('Дистрибьютор Alfadyser (Kuken) не найден в БД. Создаем новую запись...');
    distributor = await prisma.distributor.create({
      data: {
        name: 'Alfadyser (Kuken)',
        website: 'https://alfadyser.es/',
        status: 'ACCOUNT_OPENED',
        notes: 'Испанский дистрибьютор и производитель ALFA DYSER, S.L. (бренд KUKEN)',
      },
    });
  } else if (distributor.status !== 'ACCOUNT_OPENED') {
    console.log(`Обновление статуса дистрибьютора "${distributor.name}" на ACCOUNT_OPENED...`);
    distributor = await prisma.distributor.update({
      where: { id: distributor.id },
      data: { status: 'ACCOUNT_OPENED' },
    });
  }

  console.log(`Дистрибьютор: ${distributor.name} (ID: ${distributor.id}, Статус: ${distributor.status})`);

  // 2. Обновление статуса бренда KUKEN на 'CONTRACTED'
  const brand = await prisma.brand.findFirst({
    where: { name: { equals: 'KUKEN', mode: 'insensitive' } },
  });

  if (brand && brand.status !== 'CONTRACTED') {
    console.log(`Обновление статуса бренда ${brand.name} (ID: ${brand.id}) на CONTRACTED...`);
    await prisma.brand.update({
      where: { id: brand.id },
      data: { status: 'CONTRACTED' },
    });
  }

  // 3. Чтение файла
  const wb = xlsx.readFile(resolvedPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[] = xlsx.utils.sheet_to_json(sheet);

  console.log(`Всего строк в проверенном файле: ${rawRows.length}`);

  let savedSnapshotsCount = 0;
  let matchedAsinsCount = 0;
  let queuedAsinsCount = 0;
  const unmatchedEans: string[] = [];

  for (const row of rawRows) {
    // Поддержка как staging файла, так и сырого xlsx
    const rawEan = String(row['EAN'] || row['ean'] || row['EAN13'] || '').trim().replace(/\D/g, '');
    const rawPriceNetto = parseFloat(String(row['Цена Netto (€)'] || row['priceNetto'] || row['P.VENTA'] || '0').replace(',', '.'));
    const rawEcoTasa = parseFloat(String(row['Эко-таса (€)'] || row['ecoTasa'] || row['TASA'] || '0').replace(',', '.'));
    const rawCostPrice = parseFloat(String(row['Себестоимость RE 26.2% (€)'] || row['costPrice'] || '0').replace(',', '.'));
    const rawUnitsPerBox = parseInt(String(row['Штук в коробке (Caja)'] || row['unitsPerBox'] || row['CAJA'] || '1'), 10);

    if (!rawEan || isNaN(rawPriceNetto) || rawPriceNetto <= 0) {
      continue;
    }

    const priceNetto = Math.round(rawPriceNetto * 100) / 100;
    const ecoTasa = !isNaN(rawEcoTasa) && rawEcoTasa > 0 ? Math.round(rawEcoTasa * 100) / 100 : null;
    const effectiveNet = ecoTasa ? Math.round((priceNetto + ecoTasa) * 100) / 100 : priceNetto;
    const costPrice = !isNaN(rawCostPrice) && rawCostPrice > 0 
      ? rawCostPrice 
      : Math.round(effectiveNet * 1.262 * 100) / 100;
    const unitsPerBox = !isNaN(rawUnitsPerBox) && rawUnitsPerBox > 0 ? rawUnitsPerBox : 1;
    const minBoxOrder = unitsPerBox;

    // Ищем ASIN в БД по последнему снапшоту ProductFinder
    const matchingSnapshot = await prisma.productFinder.findFirst({
      where: {
        productCodesEAN: {
          contains: rawEan,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { asinId: true, asin: { select: { code: true } } },
    });

    let asinId = matchingSnapshot?.asinId || null;
    let asinCode = matchingSnapshot?.asin?.code || null;

    // Если по снапшоту не нашли, проверяем поле ASIN в файле
    if (!asinId && row['ASIN'] && row['ASIN'] !== '---') {
      const explicitAsin = String(row['ASIN']).trim();
      const dbAsin = await prisma.aSIN.findUnique({
        where: { code: explicitAsin },
      });
      if (dbAsin) {
        asinId = dbAsin.id;
        asinCode = dbAsin.code;
      }
    }

    if (asinId && asinCode) {
      matchedAsinsCount++;
      // Связываем ASIN с дистрибьютором
      await prisma.aSIN.update({
        where: { id: asinId },
        data: {
          distributors: {
            connect: { id: distributor.id },
          },
        },
      }).catch(() => {});

      // Добавляем в очередь Keepa с приоритетом 999999
      await prisma.requestProductQueue.upsert({
        where: { asin: asinCode },
        update: {
          priority: 999999,
          addedAt: new Date(),
        },
        create: {
          asin: asinCode,
          priority: 999999,
          addedAt: new Date(),
        },
      }).catch(() => {});
      queuedAsinsCount++;

      // Обновляем статус расчета комиссий
      await prisma.aSIN.update({
        where: { id: asinId },
        data: { feeStatus: 'KEEPA_REQUESTED' as any },
      }).catch(() => {});
    } else {
      unmatchedEans.push(rawEan);
    }

    // Сохраняем снапшот цен с учетом ecoTasa
    await prisma.distributorPriceSnapshot.create({
      data: {
        distributorId: distributor.id,
        asinId: asinId,
        ean: rawEan,
        priceNetto: priceNetto,
        ecoTasa: ecoTasa,
        costPrice: costPrice,
        unitsPerBox: unitsPerBox,
        minBoxOrder: minBoxOrder,
      },
    });
    savedSnapshotsCount++;
  }

  // Сохраняем несопоставленные EAN новинок
  if (unmatchedEans.length > 0) {
    const uniqueUnmatched = Array.from(new Set(unmatchedEans));
    const outPath = path.resolve(__dirname, '../../../../contractors/kuken/unmatched_eans.txt');
    fs.writeFileSync(outPath, uniqueUnmatched.join('\n'), 'utf-8');
    console.log(`\n📋 Список несопоставленных EAN новинок (${uniqueUnmatched.length} шт.) сохранен:`);
    console.log(`📄 ${outPath}`);
  }

  console.log(`\n=============================================================`);
  console.log(`✅ Импорт цен Kuken в базу данных успешно завершен!`);
  console.log(`=============================================================`);
  console.log(`- Сохранено записей в DistributorPriceSnapshot: ${savedSnapshotsCount}`);
  console.log(`- Сопоставлено с товарами ASIN в БД: ${matchedAsinsCount}`);
  console.log(`- Поставлено в очередь Keepa (приоритет 999999): ${queuedAsinsCount}`);
  console.log(`- Новинок (отсутствуют на Amazon): ${unmatchedEans.length}`);
}

main()
  .catch((err) => {
    console.error('Ошибка при импорте цен Kuken:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Скрипт безопасного импорта проверенных цен поставщика Cofan в базу данных.
 * Запускается ТОЛЬКО после явного подтверждения пользователем корректности промежуточного Excel файла.
 * 
 * Создает снапшоты в DistributorPriceSnapshot, связывает ASIN с дистрибьютором Cofan
 * и добавляет в RequestProductQueue с наивысшим приоритетом.
 * 
 * Использование:
 *   npx tsx import-cofan-to-db.ts <путь_к_промежуточному_файлу.xlsx>
 */
import * as path from 'path';
import * as fs from 'fs';

const backendDir = path.resolve(__dirname, '../../../../backend');

function requireBackendModule(moduleName: string) {
  try {
    const resolved = require.resolve(moduleName, { paths: [backendDir, process.cwd()] });
    return require(resolved);
  } catch (err: any) {
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
    console.error('Пример: cd backend && npx tsx ../.agents/skills/cofan-adapter/scripts/import-cofan-to-db.ts ../contractors/COFAN/reports/cofan_staging_prices_12345.xlsx');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), inputFileArg);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Файл не найден: ${resolvedPath}`);
  }

  console.log(`\n=============================================================`);
  console.log(`📦 Загрузка проверенного прайс-листа Cofan: ${resolvedPath}`);
  console.log(`=============================================================\n`);

  // 1. Поиск или создание дистрибьютора Cofan в БД
  let distributor = await prisma.distributor.findFirst({
    where: { name: { equals: 'Cofan', mode: 'insensitive' } },
  });

  if (!distributor) {
    console.log('Дистрибьютор Cofan не найден в БД. Создаем запись...');
    distributor = await prisma.distributor.create({
      data: {
        name: 'Cofan',
        website: 'https://www.cofan.es',
        status: 'ACCOUNT_OPENED',
        notes: 'Испанский дистрибьютор и производитель Cofan La Mancha S.A.',
      },
    });
  } else if (distributor.status !== 'ACCOUNT_OPENED') {
    console.log(`Обновление статуса дистрибьютора ${distributor.name} на ACCOUNT_OPENED...`);
    distributor = await prisma.distributor.update({
      where: { id: distributor.id },
      data: { status: 'ACCOUNT_OPENED' },
    });
  }

  console.log(`Дистрибьютор: ${distributor.name} (ID: ${distributor.id}, Статус: ${distributor.status})`);

  // 2. Обновление статуса бренда COFAN на 'CONTRACTED' (чтобы отображался во вьюшках)
  const brand = await prisma.brand.findFirst({
    where: { name: { equals: 'COFAN', mode: 'insensitive' } },
  });

  if (brand && brand.status !== 'CONTRACTED') {
    console.log(`Обновление статуса бренда ${brand.name} (ID: ${brand.id}) на CONTRACTED...`);
    await prisma.brand.update({
      where: { id: brand.id },
      data: { status: 'CONTRACTED' },
    });
  }

  // 3. Чтение промежуточного Excel файла
  const wb = xlsx.readFile(resolvedPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  console.log(`Всего строк в проверенном файле: ${rows.length}`);

  let savedSnapshotsCount = 0;
  let matchedAsinsCount = 0;
  let queuedAsinsCount = 0;
  const unmatchedEans: string[] = [];

  for (const row of rows) {
    const rawEan = String(row['EAN'] || row['ean'] || '').trim();
    const rawPriceNetto = parseFloat(String(row['Закупка Neto (€)'] || row['priceNetto'] || '0').replace(',', '.'));
    const rawCostPrice = parseFloat(String(row['Себестоимость с R.E. 26.2% (€)'] || row['costPrice'] || '0').replace(',', '.'));

    if (!rawEan || isNaN(rawPriceNetto) || rawPriceNetto <= 0) {
      continue;
    }

    const costPrice = !isNaN(rawCostPrice) && rawCostPrice > 0 
      ? rawCostPrice 
      : Math.round(rawPriceNetto * 1.262 * 100) / 100;

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

    // Если по снапшоту не нашли, проверяем явно переданный в файле ASIN
    if (!asinId && row['ASIN']) {
      const explicitAsin = String(row['ASIN']).trim();
      const dbAsin = await prisma.aSIN.findUnique({
        where: { code: explicitAsin },
      });
      if (dbAsin) {
        asinId = dbAsin.id;
        asinCode = dbAsin.code;
      }
    }

    // Если ASIN найден, связываем его с дистрибьютором и добавляем в очередь Keepa
    if (asinId && asinCode) {
      matchedAsinsCount++;
      await prisma.aSIN.update({
        where: { id: asinId },
        data: {
          distributors: {
            connect: { id: distributor.id },
          },
        },
      }).catch(() => {});

      // Очередь Keepa с наивысшим приоритетом (999999)
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
    } else {
      unmatchedEans.push(rawEan);
    }

    // Извлекаем количество штук в коробке (Embalaje) и минимальный заказ коробок (Envase Mínimo)
    const rawUnitsPerBox = parseInt(String(row['Штук в коробке (Embalaje)'] || row['unitsPerBox'] || '1'), 10);
    const unitsPerBox = !isNaN(rawUnitsPerBox) && rawUnitsPerBox > 0 ? rawUnitsPerBox : 1;

    // В веб-кабинете Cofan графа "ENVASE MÍNIMO" задает кратность в коробках (envases).
    // В базе данных поле minBoxOrder измеряется в штуках (как и у Safta).
    // Поэтому минимальный заказ в штуках = unitsPerBox * minBoxEnvases.
    const rawMinBoxEnvases = parseInt(String(row['Мин. заказ коробок (Envase)'] || row['minBoxOrder'] || '1'), 10);
    const minBoxEnvases = !isNaN(rawMinBoxEnvases) && rawMinBoxEnvases > 0 ? rawMinBoxEnvases : 1;
    const minBoxOrder = unitsPerBox * minBoxEnvases;

    // Создаем снапшот цены в DistributorPriceSnapshot
    await prisma.distributorPriceSnapshot.create({
      data: {
        distributorId: distributor.id,
        asinId: asinId,
        ean: rawEan,
        priceNetto: rawPriceNetto,
        costPrice: costPrice,
        unitsPerBox: unitsPerBox,
        minBoxOrder: minBoxOrder,
      },
    });

    savedSnapshotsCount++;
  }

  console.log(`\n=============================================================`);
  console.log(`✅ Импорт цен Cofan в базу данных успешно завершен!`);
  console.log(`- Сохранено новых снапшотов цен: ${savedSnapshotsCount}`);
  console.log(`- Привязано к товарам ASIN в базе данных: ${matchedAsinsCount}`);
  console.log(`- Добавлено в приоритетную очередь Keepa: ${queuedAsinsCount}`);
  if (unmatchedEans.length > 0) {
    console.log(`- Позиций без связи с ASIN: ${unmatchedEans.length}`);
  }
  console.log(`=============================================================\n`);

  // Контрольная проверка представления ContractedAllProductsView (только SELECT)
  console.log('Контрольная проверка данных в ContractedAllProductsView (SELECT)...');
  const viewCount = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::int as count FROM "ContractedAllProductsView" WHERE "distributor" = 'Cofan' OR "brand" = 'COFAN';
  `;
  console.log(`Доступно товаров Cofan в представлении ContractedAllProductsView: ${viewCount[0]?.count || 0}`);

  // Автоматическая очистка промежуточного staging-файла согласно правилу гигиены репозитория
  try {
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
      console.log(`🧹 Промежуточный файл успешно удален: ${resolvedPath}`);
    }
  } catch (cleanErr: any) {
    console.warn(`Не удалось удалить промежуточный файл: ${cleanErr?.message}`);
  }
}

main()
  .catch((err) => {
    console.error('Ошибка при импорте цен в БД:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

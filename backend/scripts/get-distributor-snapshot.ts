/**
 * Скрипт быстрого поиска и проверки закупочных цен дистрибьюторов в базе данных.
 *
 * Используется навыком анализа товара (analyze-product) для извлечения
 * оптовых цен (Netto) и себестоимости с налогами (Cost Price) по ASIN или EAN.
 *
 * Использование:
 *   npx tsx scripts/get-distributor-snapshot.ts <ASIN_или_EAN>
 * Пример:
 *   npx tsx scripts/get-distributor-snapshot.ts B0HFKT8N24
 *   npx tsx scripts/get-distributor-snapshot.ts 8412688672950
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения из backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Инициализируем пул подключений к PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Подключаем адаптер PrismaPg для работы с Prisma 7
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Основная функция поиска снапшотов цен дистрибьюторов
 */
async function main() {
  // Получаем поисковый запрос из аргументов командной строки
  const rawInput = process.argv[2];

  if (!rawInput) {
    console.error('Ошибка: укажите ASIN или EAN для поиска.');
    console.error('Пример: npx tsx scripts/get-distributor-snapshot.ts B0HFKT8N24');
    process.exit(1);
  }

  // Очищаем входной параметр от пробелов и приводим к верхнему регистру
  const query = rawInput.trim().toUpperCase();
  const isEan = /^\d{8,14}$/.test(query);

  console.log(`\n=== Поиск закупочных цен дистрибьюторов в базе данных ===`);
  console.log(`Запрос: ${query} (Тип: ${isEan ? 'EAN' : 'ASIN'})\n`);

  // 1. Поиск информации по ASIN и связанным таблицам
  let asinRecord: any = null;
  let targetEan: string | null = isEan ? query : null;
  let targetAsin: string | null = !isEan ? query : null;

  if (isEan) {
    targetEan = query;
    // Ищем товар по EAN
    const foundByEan: any[] = await prisma.$queryRaw`
      SELECT a.id, a.code, a."brandId", b.name as brand_name, m.name as manufacturer_name
      FROM "ASIN" a
      JOIN "ProductFinder" pf ON pf."asinId" = a.id
      LEFT JOIN "Brand" b ON a."brandId" = b.id
      LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
      WHERE pf."productCodesEAN" = ${query}
      ORDER BY pf."createdAt" DESC
      LIMIT 1
    `;
    if (foundByEan.length > 0) {
      asinRecord = foundByEan[0];
      targetAsin = asinRecord.code;
    }
  } else {
    // Если передан код ASIN, ищем запись в таблице ASIN
    const foundByAsin: any[] = await prisma.$queryRaw`
      SELECT a.id, a.code, a."brandId", b.name as brand_name, m.name as manufacturer_name
      FROM "ASIN" a
      LEFT JOIN "Brand" b ON a."brandId" = b.id
      LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
      WHERE a.code = ${query}
      LIMIT 1
    `;
    if (foundByAsin.length > 0) {
      asinRecord = foundByAsin[0];
    }
  }

  // 2. Поиск снапшотов цен в таблице DistributorPriceSnapshot
  let snapshots: any[] = [];

  if (asinRecord?.id) {
    // Поиск по ID ASIN или по EAN
    snapshots = await prisma.$queryRaw`
      SELECT 
        s.id,
        s."distributorId",
        s."asinId",
        s.ean,
        s."priceNetto",
        s."costPrice",
        s."createdAt",
        d.name as distributor_name,
        d.status as distributor_status
      FROM "DistributorPriceSnapshot" s
      JOIN "Distributor" d ON s."distributorId" = d.id
      WHERE s."asinId" = ${asinRecord.id} OR s.ean = ${targetEan || ''}
      ORDER BY s."createdAt" DESC
    `;
  } else if (targetEan) {
    // Поиск строго по EAN, если ASIN еще не привязан
    snapshots = await prisma.$queryRaw`
      SELECT 
        s.id,
        s."distributorId",
        s."asinId",
        s.ean,
        s."priceNetto",
        s."costPrice",
        s."createdAt",
        d.name as distributor_name,
        d.status as distributor_status
      FROM "DistributorPriceSnapshot" s
      JOIN "Distributor" d ON s."distributorId" = d.id
      WHERE s.ean = ${targetEan}
      ORDER BY s."createdAt" DESC
    `;
  }

  // 3. Проверка данных о контракте из ContractedProductsView (если бренд на контракте)
  let contractedData: any = null;
  if (targetAsin) {
    try {
      const contractedRows: any[] = await prisma.$queryRaw`
        SELECT * FROM "ContractedProductsView"
        WHERE asin = ${targetAsin}
        LIMIT 1
      `;
      if (contractedRows.length > 0) {
        contractedData = contractedRows[0];
      }
    } catch {
      // Представление может отсутствовать или быть не применимо
    }
  }

  // 4. Проверка обработанных данных Keepa (габариты, комиссии) и привязки к последней выгрузке бренда
  let keepaData: any = null;
  let latestKeepaSnapshot: any = null;
  let latestBrandExport: any = null;
  let isInLatestBrandExport = false;

  if (targetAsin && asinRecord) {
    try {
      // Ищем самую свежую выгрузку бренда в таблице KeepaExport
      if (asinRecord.brandId) {
        const brandExports: any[] = await prisma.$queryRaw`
          SELECT id, "createdAt"
          FROM "KeepaExport"
          WHERE "brandId" = ${asinRecord.brandId}
          ORDER BY "createdAt" DESC
          LIMIT 1
        `;
        if (brandExports.length > 0) {
          latestBrandExport = brandExports[0];

          // Проверяем, вошел ли наш ASIN в эту последнюю выгрузку бренда
          const checkInExport: any[] = await prisma.$queryRaw`
            SELECT 1 FROM "_ASINToKeepaExport"
            WHERE "B" = ${latestBrandExport.id} AND "A" = ${asinRecord.id}
            LIMIT 1
          `;
          isInLatestBrandExport = checkInExport.length > 0;
        }
      }

      // Ищем самый свежий снапшот Keepa ProductFinder для проверки цен
      const snapRows: any[] = await prisma.$queryRaw`
        SELECT 
          pf."createdAt",
          pf."buyBoxCurrent",
          pf."amazonCurrent",
          pf."newCurrent",
          pf."salesRankCurrent"
        FROM "ProductFinder" pf
        WHERE pf."asinId" = ${asinRecord.id}
        ORDER BY pf."createdAt" DESC
        LIMIT 1
      `;
      if (snapRows.length > 0) {
        latestKeepaSnapshot = snapRows[0];
      }

      const keepaRows: any[] = await prisma.$queryRaw`
        SELECT 
          kd."asin",
          kd."title",
          kd."fbaFee",
          kd."referralFeePercent",
          kd."sizeTier",
          kd."currentSalesRank",
          kd."lastProcessedAt"
        FROM "KeepaApiProcessedData" kd
        WHERE kd."asin" = ${targetAsin}
        LIMIT 1
      `;
      if (keepaRows.length > 0) {
        keepaData = keepaRows[0];
      }
    } catch {
      // Игнорируем ошибку, если таблица пуста
    }
  }

  // 5. Вывод результатов
  console.log('--- Основные параметры товара ---');
  console.log(`ASIN: ${targetAsin || 'Не найден в каталоге'}`);
  console.log(`EAN: ${targetEan || snapshots[0]?.ean || 'Не указан'}`);
  if (asinRecord) {
    console.log(`Бренд в БД: ${asinRecord.brand_name || 'Не указан'}`);
    console.log(`Производитель в БД: ${asinRecord.manufacturer_name || 'Не указан'}`);
  }
  if (keepaData?.title) {
    console.log(`Название: ${keepaData.title}`);
  }

  console.log('\n--- Снапшоты закупочных цен (DistributorPriceSnapshot) ---');
  if (snapshots.length === 0) {
    console.log('Снапшотов цен в базе данных не найдено.');
  } else {
    console.log(`Найдено записей: ${snapshots.length}\n`);
    for (const [index, s] of snapshots.entries()) {
      console.log(`[Снапшот #${index + 1}]`);
      console.log(`- Дистрибьютор: ${s.distributor_name} (Статус: ${s.distributor_status})`);
      console.log(`- Оптовая цена (Netto): ${s.priceNetto.toFixed(2)} €`);
      console.log(`- Себестоимость с налогами (IVA 21% + RE 5.2%): ${s.costPrice.toFixed(2)} €`);
      console.log(`- Штрихкод (EAN): ${s.ean || 'нет'}`);
      console.log(`- Дата прайс-листа: ${new Date(s.createdAt).toLocaleString('ru-RU')}`);
      console.log('');
    }
  }

  // Вывод аналитики контракта, если есть
  if (contractedData) {
    console.log('--- Данные по контракту (ContractedProductsView) ---');
    console.log(`- Актуальная цена Buy Box: ${contractedData.buyBoxPrice ? contractedData.buyBoxPrice.toFixed(2) + ' €' : 'нет'}`);
    console.log(`- Оптовая цена закупки (netPrice): ${contractedData.netPrice ? contractedData.netPrice.toFixed(2) + ' €' : (contractedData.costPrice ? (contractedData.costPrice / 1.262).toFixed(2) + ' €' : 'нет')}`);
    console.log(`- Себестоимость с налогами (grossPrice): ${contractedData.grossPrice ? contractedData.grossPrice.toFixed(2) + ' €' : (contractedData.costPrice ? contractedData.costPrice.toFixed(2) + ' €' : 'нет')}`);
    console.log(`- Чистая прибыль (Net Profit): ${contractedData.netProfit ? contractedData.netProfit.toFixed(2) + ' €' : 'нет'}`);
    console.log(`- ROI: ${contractedData.roiPercent ? contractedData.roiPercent.toFixed(1) + '%' : 'нет'}`);
    console.log(`- Маржинальность: ${contractedData.marginPercent ? contractedData.marginPercent.toFixed(1) + '%' : 'нет'}`);
    console.log('');
  } else if (keepaData) {
    console.log('--- Данные Keepa (KeepaApiProcessedData) ---');
    console.log(`- Размерный класс (Size Tier): ${keepaData.sizeTier || 'нет'}`);
    console.log(`- Комиссия FBA: ${keepaData.fbaFee ? keepaData.fbaFee.toFixed(2) + ' €' : 'нет'}`);
    console.log(`- Комиссия Referral: ${keepaData.referralFeePercent ? keepaData.referralFeePercent + '%' : 'нет'}`);
    console.log('');
  }

  // 6. Проверка актуальности данных Keepa относительно последней выгрузки бренда
  console.log('--- Свежесть данных каталога Keepa ---');
  if (latestBrandExport) {
    const exportDate = new Date(latestBrandExport.createdAt);
    console.log(`- Последняя выгрузка бренда (KeepaExport #${latestBrandExport.id}): ${exportDate.toLocaleString('ru-RU')}`);
    
    if (isInLatestBrandExport) {
      console.log(`\x1b[32m✅ [АКТУАЛЬНО]\x1b[0m Товар входит в последнюю выгрузку бренда от ${exportDate.toLocaleString('ru-RU')}.`);
    } else {
      console.log(`\x1b[31m⚠️ [ВНИМАНИЕ: ТОВАР НЕ ВОШЕЛ В ПОСЛЕДНЮЮ ВЫГРУЗКУ БРЕНДА]\x1b[0m`);
      console.log(`\x1b[33mТовар отсутствовал в выборке Keepa от ${exportDate.toLocaleString('ru-RU')} (вероятно, BSR превысил лимит строк или товар временно недоступен)!\x1b[0m`);
    }
  }

  if (latestKeepaSnapshot) {
    const snapDate = new Date(latestKeepaSnapshot.createdAt);
    const ageHours = (Date.now() - snapDate.getTime()) / (1000 * 60 * 60);
    const isStale = ageHours > 48 || (latestBrandExport && !isInLatestBrandExport);

    if (isStale) {
      console.log(`\x1b[31m[СНАПШОТ УСТАРЕЛ]\x1b[0m Дата снапшота товара: \x1b[31m${snapDate.toLocaleString('ru-RU')}\x1b[0m (${Math.round(ageHours)} ч. назад)`);
      console.log('\x1b[33mЦена и BSR в базе данных неактуальны! Обязательно проверьте карточку на Amazon вручную.\x1b[0m');
    } else {
      console.log(`\x1b[32m[СНАПШОТ СВЕЖИЙ]\x1b[0m Дата снапшота товара: \x1b[32m${snapDate.toLocaleString('ru-RU')}\x1b[0m (${Math.round(ageHours)} ч. назад)`);
    }
    console.log(`- Цена Buy Box в снапшоте: ${latestKeepaSnapshot.buyBoxCurrent ? latestKeepaSnapshot.buyBoxCurrent + ' €' : 'нет'}`);
    console.log(`- Цена Amazon в снапшоте: ${latestKeepaSnapshot.amazonCurrent ? latestKeepaSnapshot.amazonCurrent + ' €' : 'нет'}`);
    console.log(`- Цена New в снапшоте: ${latestKeepaSnapshot.newCurrent ? latestKeepaSnapshot.newCurrent + ' €' : 'нет'}`);
    console.log(`- BSR в снапшоте: ${latestKeepaSnapshot.salesRankCurrent || 'нет'}`);
    console.log('');
  } else {
    console.log('\x1b[31m[НЕТ СНАПШОТОВ]\x1b[0m Снапшотов Keepa по данному товару в базе нет.\x1b[0m\n');
  }

  console.log('=== Завершено ===\n');
}

// Запуск скрипта с обработкой ошибок и гарантированным закрытием пула
main()
  .catch((err) => {
    console.error('Критическая ошибка при поиске снапшота цен:', err);
    process.exit(1);
  })
  .finally(async () => {
    // Отключаем Prisma и закрываем пул соединений
    await prisma.$disconnect();
    await pool.end();
  });

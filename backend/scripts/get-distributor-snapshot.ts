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
    // Если передан EAN, сначала ищем соответствующий ASIN через снапшоты или сырые данные
    const foundByEan: any[] = await prisma.$queryRaw`
      SELECT a.id, a.code, b.name as brand_name, m.name as manufacturer_name
      FROM "DistributorPriceSnapshot" s
      JOIN "ASIN" a ON s."asinId" = a.id
      LEFT JOIN "Brand" b ON a."brandId" = b.id
      LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
      WHERE s.ean = ${query}
      LIMIT 1
    `;
    if (foundByEan.length > 0) {
      asinRecord = foundByEan[0];
      targetAsin = asinRecord.code;
    }
  } else {
    // Если передан код ASIN, ищем запись в таблице ASIN
    const foundByAsin: any[] = await prisma.$queryRaw`
      SELECT a.id, a.code, b.name as brand_name, m.name as manufacturer_name
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

  // 4. Проверка обработанных данных Keepa (габариты, комиссии)
  let keepaData: any = null;
  if (targetAsin) {
    try {
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

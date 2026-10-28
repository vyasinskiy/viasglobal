import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Подключение к базе данных через адаптер pg
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Входные параметры
const TARGET_BRAND_INPUT = 'AmzHandler';
const TARGET_SELLER_INPUT = 'A1RVGO7NJXGT0Q';

// Результаты и аналитические заметки Private Label
const ANALYSIS_NOTES =
  'Подтвержден Private Label. Продавец Shenzhen Young Brother Technology Co., Ltd (A1RVGO7NJXGT0Q) удерживает 100% Buy Box на листингах бренда AmzHandler. В медиа-материалах листингов Amazon (главное промо-видео) правообладателем и создателем прямо указана компания Shenzhen Young Brother Technology Co., Ltd. Витрина продавца на 80-100% состоит из товаров данного бренда.';

async function main() {
  try {
    console.log(`\n========================================================`);
    console.log(`🚀 Старт миграции данных: добавление связки Private Label`);
    console.log(`   Бренд: "${TARGET_BRAND_INPUT}"`);
    console.log(`   Продавец: "${TARGET_SELLER_INPUT}"`);
    console.log(`========================================================\n`);

    // 1. Поиск всех записей бренда (с учетом регистра/дублей)
    console.log(`[1/3] Поиск бренда "${TARGET_BRAND_INPUT}" в БД...`);
    const brands = await prisma.brand.findMany({
      where: {
        name: { equals: TARGET_BRAND_INPUT, mode: 'insensitive' },
      },
    });

    if (brands.length === 0) {
      throw new Error(`Бренд "${TARGET_BRAND_INPUT}" не найден в базе данных!`);
    }
    console.log(`   ✅ Найдено брендов: ${brands.length} (${brands.map((b) => `${b.name} ID:${b.id}`).join(', ')})`);

    // 2. Поиск продавца (Seller) в базе данных
    console.log(`[2/3] Поиск продавца "${TARGET_SELLER_INPUT}" в БД...`);
    const seller = await prisma.seller.findFirst({
      where: {
        OR: [
          { id: { equals: TARGET_SELLER_INPUT, mode: 'insensitive' } },
          { name: { equals: TARGET_SELLER_INPUT, mode: 'insensitive' } },
        ],
      },
    });

    if (!seller) {
      throw new Error(`Продавец "${TARGET_SELLER_INPUT}" не найден в базе данных!`);
    }
    console.log(`   ✅ Продавец найден: ${seller.name} (Seller ID: ${seller.id})`);

    // 3. Создание или обновление записей PrivateLabel для всех найденных вариаций бренда
    console.log(`[3/3] Добавление связки в таблицу PrivateLabel...`);
    for (const brand of brands) {
      const privateLabel = await prisma.privateLabel.upsert({
        where: {
          brandId_sellerId: {
            brandId: brand.id,
            sellerId: seller.id,
          },
        },
        update: {
          notes: ANALYSIS_NOTES,
        },
        create: {
          brandId: brand.id,
          sellerId: seller.id,
          notes: ANALYSIS_NOTES,
        },
      });
      console.log(`   ✅ Зафиксировано в PrivateLabel (ID: ${privateLabel.id}) для бренда "${brand.name}" (ID: ${brand.id})`);
    }

    console.log(`\n✅ УСПЕШНО: Связка Private Label зафиксирована в БД.`);
    console.log(`   Все товары бренда "${TARGET_BRAND_INPUT}" от продавца "${seller.name}" теперь будут фильтроваться как PRIVATE_LABEL.\n`);
  } catch (error: any) {
    console.error(`\n❌ Ошибка миграции данных: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Входные параметры (могут быть ID или именем)
const TARGET_BRAND_INPUT = 'BFDSGWQ';
const TARGET_SELLER_INPUT = 'zhangxipei0724';

// Результаты и заметки анализа Private Label (данные о юрлице, VAT/IVA, удержании Buy Box)
const ANALYSIS_NOTES = `Доля удержания Buy Box продавцом zhangxipei0724 составляет 88.7% (на 1708 из 1926 листингов). Сторонние продавцы представлены слабо (суммарно 11.3%), что типично для штучных FBM реселлеров. Вывод: Бренд BFDSGWQ является Private Label продавца zhangxipei0724.`;

async function main() {
  try {
    console.log(`\n========================================================`);
    console.log(`🚀 Старт миграции данных: добавление связки Private Label`);
    console.log(`   Бренд: "${TARGET_BRAND_INPUT}"`);
    console.log(`   Продавец: "${TARGET_SELLER_INPUT}"`);
    console.log(`========================================================\n`);

    // 1. Поиск бренда в базе данных (по ID или имени)
    console.log(`[1/3] Поиск бренда "${TARGET_BRAND_INPUT}" в БД...`);
    const brandIdNum = Number(TARGET_BRAND_INPUT);
    const isBrandId = !isNaN(brandIdNum) && Number.isInteger(brandIdNum);

    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          ...(isBrandId ? [{ id: brandIdNum }] : []),
          { name: { equals: TARGET_BRAND_INPUT, mode: 'insensitive' } },
        ],
      },
    });

    if (!brand) {
      throw new Error(`Бренд "${TARGET_BRAND_INPUT}" не найден в базе данных!`);
    }
    console.log(`   ✅ Бренд найден: ${brand.name} (ID: ${brand.id})`);

    // 2. Поиск продавца (Seller) в базе данных (по Seller ID или имени)
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

    // 3. Создание или обновление записи PrivateLabel
    console.log(`[3/3] Добавление связки в таблицу PrivateLabel...`);
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

    console.log(`\n✅ УСПЕШНО: Связка Private Label зафиксирована в БД (ID записи: ${privateLabel.id}).`);
    console.log(`   Заметки анализа сохранены в поле notes.`);
    console.log(`   Все товары бренда "${brand.name}" от продавца "${seller.name}" теперь будут фильтроваться как PRIVATE_LABEL.\n`);

  } catch (error: any) {
    console.error(`\n❌ Ошибка миграции данных: ${error.message}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

/**
 * Скрипт миграции данных: добавление связки Private Label
 * Бренд: Poligino
 * Продавец: SUNRICE MERCANTILE (Seller ID: A2U0KRURO6PYX6)
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Читаем строку подключения к базе данных из переменных окружения
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

// Создаем пул подключений к базе данных PostgreSQL
const pool = new Pool({ connectionString });

// Инициализируем PrismaPg адаптер
const adapter = new PrismaPg(pool);

// Создаем инстанс PrismaClient
const prisma = new PrismaClient({ adapter });

// Входные параметры (могут быть ID или именем)
const TARGET_BRAND_INPUT = 'Poligino';
const TARGET_SELLER_INPUT = 'A2U0KRURO6PYX6';

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
      update: {},
      create: {
        brandId: brand.id,
        sellerId: seller.id,
      },
    });

    console.log(`\n✅ УСПЕШНО: Связка Private Label зафиксирована в БД (ID записи: ${privateLabel.id}).`);
    console.log(`   Все товары бренда "${brand.name}" от продавца "${seller.name}" теперь будут фильтроваться как PRIVATE_LABEL.\n`);

  } catch (error: any) {
    console.error(`\n❌ Ошибка миграции данных: ${error.message}\n`);
    process.exit(1);
  } finally {
    // Корректно закрываем соединение с базой данных
    await prisma.$disconnect();
    await pool.end();
  }
}

main();

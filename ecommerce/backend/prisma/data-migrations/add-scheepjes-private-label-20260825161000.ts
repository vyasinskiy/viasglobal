import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Входные параметры связки
const TARGET_BRAND_INPUT = 'Scheepjes';
const TARGET_SELLER_INPUT = 'AYU78Z4MXV5HT';

// Обоснование и ключевые доказательства связки Private Label
const ANALYSIS_NOTES = `1. Юрисдикция: Юрлицо продавца (De Halve Garen BV) зарегистрировано в Нидерландах - в той же стране, где основан и зарегистрирован бренд Scheepjes.
2. Налоговый статус: Испанский номер IVA (ESN0307302J) оформлен на иностранную организацию-нерезидента для прямой торговли на Amazon Spain по FBA.
3. Прямая связь вендора: Email службы поддержки (scheepjes_vendor@divisionm.eu) прямо указывает на официального вендора Scheepjes.
4. Семантика названий: Торговое имя Hilos y Sueños (исп. "нитки/пряжа") повторяет значение нидерландского имени юрлица De Halve Garen (нидерл. "пряжа/нитки").
5. Доминирование: Продавец единолично контролирует 98.4% каталога бренда на Amazon.es (602 из 612 ASIN).
Вывод: Прямой монопольный канал бренда на маркетплейсе. Рынок оптовых перепродаж (Wholesale) отсутствует.`;

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

    // 3. Создание или обновление записи PrivateLabel с заметками анализа
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

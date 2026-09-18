/**
 * Скрипт миграции данных: установка статуса NO_EU_DISTRIBUTOR для бренда NWOUIIAY.
 *
 * Устанавливает поле status = 'NO_EU_DISTRIBUTOR' и сохраняет аналитические заметки
 * в таблице Brand. В результате все товары данного бренда автоматически исключаются
 * из выдачи оптовых кандидатов (WholesaleCandidatesView).
 */

import { PrismaClient, BrandStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Читаем URL подключения к базе данных
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@100.92.50.18:5432/viasglobal_db?schema=public';

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Целевой бренд
const TARGET_BRAND_NAME = 'NWOUIIAY';

// Аналитические заметки NotebookLM и валидации
const ANALYSIS_NOTES = `У бренда NWOUIIAY отсутствуют официальные B2B дистрибьюторы или эксклюзивная дилерская сеть в ЕС.
Правообладатель ТМ: Dongguan Zhuquan Technology Co., Ltd. (ранее Shenzhen OuKu E-commerce Co., Ltd.), Дунгуань, КНР.
Бизнес-модель: виртуальный бренд (Private Label Operator) на контрактных OEM/ODM фабриках (кластеры Цыси, Нинбо, Аньхой).
Продажи на Amazon ведутся независимыми китайскими и гонконгскими селлерами через прямой кросс-бордер импорт.
Официальная оптовая закупка на территории Европейского союза невозможна.`;

async function main() {
  console.log(`\n================================================================`);
  console.log(`🚀 Старт миграции данных: установка статуса бренда NO_EU_DISTRIBUTOR`);
  console.log(`   Бренд: "${TARGET_BRAND_NAME}"`);
  console.log(`================================================================\n`);

  // 1. Поиск бренда в БД
  console.log(`[1/2] Поиск бренда "${TARGET_BRAND_NAME}" в базе данных...`);
  const brand = await prisma.brand.findFirst({
    where: {
      name: { equals: TARGET_BRAND_NAME, mode: 'insensitive' },
    },
    include: {
      asins: true,
    },
  });

  if (!brand) {
    throw new Error(`[ОШИБКА] Бренд "${TARGET_BRAND_NAME}" не найден в базе данных!`);
  }

  console.log(`   ✅ Бренд найден: ${brand.name} (ID: ${brand.id})`);
  console.log(`   📦 Привязано товаров ASIN в каталоге: ${brand.asins.length} шт.`);

  // 2. Обновление статуса бренда и заметок
  console.log(`\n[2/2] Установка статуса NO_EU_DISTRIBUTOR и заметок анализа...`);
  const updatedBrand = await prisma.brand.update({
    where: { id: brand.id },
    data: {
      status: BrandStatus.NO_EU_DISTRIBUTOR,
      notes: ANALYSIS_NOTES,
    },
  });

  console.log(`   ✅ Статус бренда успешно обновлен: ${updatedBrand.status}`);
  console.log(`   📝 Заметки сохранены.`);
  console.log(`\n🎉 Миграция успешно выполнена! Товары бренда "${updatedBrand.name}" теперь исключены из WholesaleCandidatesView.`);
}

main()
  .catch((e) => {
    console.error('\n❌ Ошибка при выполнении миграции данных:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

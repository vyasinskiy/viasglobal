/**
 * Скрипт миграции данных: Слияние дубликатов производителей и нормализация названий.
 * 
 * Логика:
 * 1. Удаление вендор-кодов Amazon Vendor Central в скобках (напр. COFB0, MAMQ3, CES7F, EMOS5, PUTJ7, VEUI5, DUNMR, 3PL).
 * 2. Унификация правовых форм испанских и европейских компаний:
 *    - S.L. / SL -> ", S.L."
 *    - S.L.U. / SLU -> ", S.L.U."
 *    - S.A. / SA -> ", S.A."
 *    - S.A.U. / SAU -> ", S.A.U."
 *    - S.R.L. / SRL -> ", S.R.L."
 *    - B.V. / BV -> " B.V."
 *    - GMBH -> " GMBH"
 * 3. Перепривязка ASIN.manufacturerId с дубликатов на основной ID (isAnalyzed = true либо больше ASIN).
 * 4. Удаление дубликатов из таблицы Manufacturer.
 * 5. Обновление имени основных производителей на нормализованное.
 * 6. Синхронизация поля manufacturer в ProductFinder.
 * 
 * Запуск:
 *   cd backend && npx tsx prisma/data-migrations/normalize-and-merge-manufacturers.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { normalizeManufacturerName } from '../../scripts/parse-keepa';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Старт миграции нормализации и слияния дубликатов производителей ---');

  // Получаем всех производителей
  const manufacturers: any[] = await prisma.$queryRaw`
    SELECT 
      m.id,
      m.name,
      m."isAnalyzed",
      (SELECT COUNT(*) FROM "ASIN" a WHERE a."manufacturerId" = m.id)::int as asin_count
    FROM "Manufacturer" m
    ORDER BY m.id ASC;
  `;

  console.log(`Всего производителей в БД: ${manufacturers.length}`);

  // Группируем по нормализованному имени
  const groupMap = new Map<string, any[]>();
  for (const m of manufacturers) {
    const norm = normalizeManufacturerName(m.name);
    if (!norm) continue;
    if (!groupMap.has(norm)) {
      groupMap.set(norm, []);
    }
    groupMap.get(norm)!.push(m);
  }

  let mergedGroupsCount = 0;
  let deletedDuplicatesCount = 0;
  let updatedNamesCount = 0;

  for (const [normalizedName, items] of groupMap.entries()) {
    // Сортируем: сначала isAnalyzed = true, затем по количеству ASIN, затем по наименьшему id
    items.sort((a, b) => {
      const aAnalyzed = a.isAnalyzed ? 1 : 0;
      const bAnalyzed = b.isAnalyzed ? 1 : 0;
      if (aAnalyzed !== bAnalyzed) return bAnalyzed - aAnalyzed;
      if (b.asin_count !== a.asin_count) return b.asin_count - a.asin_count;
      return a.id - b.id;
    });

    const primary = items[0];
    const duplicates = items.slice(1);

    // Если есть дубликаты, перепривязываем ASIN и удаляем дубликаты
    if (duplicates.length > 0) {
      for (const dup of duplicates) {
        await prisma.aSIN.updateMany({
          where: { manufacturerId: dup.id },
          data: { manufacturerId: primary.id },
        });

        await prisma.manufacturer.delete({
          where: { id: dup.id },
        });

        deletedDuplicatesCount++;
      }
      mergedGroupsCount++;
    }

    // Если имя отличается от нормализованного, обновляем
    if (primary.name !== normalizedName) {
      await prisma.manufacturer.update({
        where: { id: primary.id },
        data: { name: normalizedName },
      });
      updatedNamesCount++;
    }
  }

  console.log(`Объединено групп дубликатов: ${mergedGroupsCount}`);
  console.log(`Удалено избыточных записей: ${deletedDuplicatesCount}`);
  console.log(`Обновлено имен до нормализованного стандарта: ${updatedNamesCount}`);

  // Синхронизируем текстовое поле manufacturer в ProductFinder
  console.log('Синхронизация поля manufacturer в ProductFinder...');
  const updatedSnapshots = await prisma.$executeRaw`
    UPDATE "ProductFinder" snap
    SET "manufacturer" = m.name
    FROM "ASIN" a
    JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    WHERE snap."asinId" = a.id
      AND snap."manufacturer" IS NOT NULL
      AND snap."manufacturer" != m.name;
  `;
  console.log(`Обновлено снапшотов ProductFinder: ${updatedSnapshots}`);

  console.log('\n--- Миграция успешно завершена! ---');
}

main()
  .catch((err) => {
    console.error('Ошибка миграции производителей:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

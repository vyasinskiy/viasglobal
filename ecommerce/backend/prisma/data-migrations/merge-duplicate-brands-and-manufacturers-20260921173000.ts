/**
 * Скрипт миграции данных: Слияние дубликатов брендов и производителей с приведением к UPPERCASE.
 * 
 * Логика работы:
 * 1. БРЕНДЫ (Brand):
 *    - Группирует все бренды по UPPER(TRIM(name)).
 *    - Для групп с > 1 записи:
 *      * Выбирает основной бренд: приоритет отдается статусу != UNPROCESSED (например, CONTRACTED, NO_EU_DISTRIBUTOR).
 *        Если статусы одинаковые — выбирается тот, у которого больше привязано товаров (ASIN).
 *      * Перепривязывает все товары ASIN, связки PrivateLabel и KeepaExport на основной бренд.
 *      * Обновляет имя основного бренда на UPPER(TRIM(name)).
 *      * Удаляет дубликаты.
 *    - Для одиночных брендов: приводит name к UPPER(TRIM(name)).
 * 
 * 2. ПРОИЗВОДИТЕЛИ (Manufacturer):
 *    - Группирует по UPPER(TRIM(name)).
 *    - Выбирает основного производителя (приоритет isAnalyzed = true, либо больше ASIN).
 *    - Перепривязывает ASIN на основного производителя.
 *    - Обновляет имя на UPPER(TRIM(name)).
 *    - Удаляет дубликаты.
 * 
 * Запуск:
 *   npx tsx prisma/data-migrations/merge-duplicate-brands-and-manufacturers-20260921173000.ts
 */

import { PrismaClient, BrandStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function mergeBrands() {
  console.log('\n--- 1. Слияние дубликатов Брендов (Brand) ---');
  
  // Получаем все группы дубликатов по UPPER(TRIM(name))
  const duplicateGroups: any[] = await prisma.$queryRaw`
    SELECT 
      UPPER(TRIM(b.name)) as upper_name,
      json_agg(json_build_object(
        'id', b.id,
        'name', b.name,
        'status', b.status::text,
        'notes', b.notes,
        'asins', (SELECT count(*) FROM "ASIN" a WHERE a."brandId" = b.id)
      )) as items
    FROM "Brand" b
    GROUP BY UPPER(TRIM(b.name))
    HAVING COUNT(*) > 1;
  `;

  console.log(`Найдено групп дубликатов брендов: ${duplicateGroups.length}`);

  let mergedCount = 0;
  let deletedBrandsCount = 0;

  for (const group of duplicateGroups) {
    const items: any[] = group.items;

    // Сортируем: сначала с рабочими статусами, затем по количеству ASIN
    items.sort((a, b) => {
      const aHasStatus = a.status !== 'UNPROCESSED' ? 1 : 0;
      const bHasStatus = b.status !== 'UNPROCESSED' ? 1 : 0;
      if (aHasStatus !== bHasStatus) return bHasStatus - aHasStatus;
      return parseInt(b.asins) - parseInt(a.asins);
    });

    const primary = items[0];
    const duplicates = items.slice(1);
    const targetUpperName = group.upper_name;

    // Сохраняем объединенные заметки notes, если они были у дубликатов
    const combinedNotes = items
      .map((i) => i.notes)
      .filter(Boolean)
      .join('\n---\n') || null;

    // 1. Перепривязываем зависимости дубликатов на primary и удаляем дубликаты
    for (const dup of duplicates) {
      // 1. ASIN
      await prisma.aSIN.updateMany({
        where: { brandId: dup.id },
        data: { brandId: primary.id },
      });

      // 2. PrivateLabel
      // Проверяем, чтобы не возникло конфликта @@unique([brandId, sellerId])
      const plRecords = await prisma.privateLabel.findMany({ where: { brandId: dup.id } });
      for (const pl of plRecords) {
        const existingPl = await prisma.privateLabel.findUnique({
          where: {
            brandId_sellerId: {
              brandId: primary.id,
              sellerId: pl.sellerId,
            },
          },
        });
        if (!existingPl) {
          await prisma.privateLabel.update({
            where: { id: pl.id },
            data: { brandId: primary.id },
          });
        } else {
          // Если связка уже есть у основного, удаляем дубль связки
          await prisma.privateLabel.delete({ where: { id: pl.id } });
        }
      }

      // 3. KeepaExport
      await prisma.keepaExport.updateMany({
        where: { brandId: dup.id },
        data: { brandId: primary.id },
      });

      // 4. Удаляем сам дубликат бренда
      await prisma.brand.delete({ where: { id: dup.id } });
      deletedBrandsCount++;
    }

    // 2. Теперь, когда дубликаты удалены, безопасно обновляем имя и статус основного бренда
    await prisma.brand.update({
      where: { id: primary.id },
      data: {
        name: targetUpperName,
        notes: combinedNotes,
        status: primary.status as BrandStatus,
      },
    });

    mergedCount++;
  }

  // Приводим все оставшиеся бренды (одиночные) к UPPERCASE
  const singleBrandsUpdated = await prisma.$executeRaw`
    UPDATE "Brand"
    SET "name" = UPPER(TRIM("name"))
    WHERE "name" != UPPER(TRIM("name"));
  `;

  console.log(`Объединено групп брендов: ${mergedCount}`);
  console.log(`Удалено избыточных записей брендов: ${deletedBrandsCount}`);
  console.log(`Одиночных брендов переведено в UPPERCASE: ${singleBrandsUpdated}`);
}

async function mergeManufacturers() {
  console.log('\n--- 2. Слияние дубликатов Производителей (Manufacturer) ---');
  
  const duplicateGroups: any[] = await prisma.$queryRaw`
    SELECT 
      UPPER(TRIM(m.name)) as upper_name,
      json_agg(json_build_object(
        'id', m.id,
        'name', m.name,
        'isAnalyzed', m."isAnalyzed",
        'asins', (SELECT count(*) FROM "ASIN" a WHERE a."manufacturerId" = m.id)
      )) as items
    FROM "Manufacturer" m
    GROUP BY UPPER(TRIM(m.name))
    HAVING COUNT(*) > 1;
  `;

  console.log(`Найдено групп дубликатов производителей: ${duplicateGroups.length}`);

  let mergedCount = 0;
  let deletedManufacturersCount = 0;

  for (const group of duplicateGroups) {
    const items: any[] = group.items;

    // Сортируем: сначала isAnalyzed = true, затем по количеству ASIN
    items.sort((a, b) => {
      const aAnalyzed = a.isAnalyzed ? 1 : 0;
      const bAnalyzed = b.isAnalyzed ? 1 : 0;
      if (aAnalyzed !== bAnalyzed) return bAnalyzed - aAnalyzed;
      return parseInt(b.asins) - parseInt(a.asins);
    });

    const primary = items[0];
    const duplicates = items.slice(1);
    const targetUpperName = group.upper_name;

    // 1. Перепривязываем ASIN и удаляем дубликаты
    for (const dup of duplicates) {
      await prisma.aSIN.updateMany({
        where: { manufacturerId: dup.id },
        data: { manufacturerId: primary.id },
      });

      await prisma.manufacturer.delete({ where: { id: dup.id } });
      deletedManufacturersCount++;
    }

    // 2. Обновляем основного производителя
    await prisma.manufacturer.update({
      where: { id: primary.id },
      data: {
        name: targetUpperName,
        isAnalyzed: items.some((i) => i.isAnalyzed),
      },
    });

    mergedCount++;
  }

  // Приводим все оставшиеся производители (одиночные) к UPPERCASE
  const singleManufacturersUpdated = await prisma.$executeRaw`
    UPDATE "Manufacturer"
    SET "name" = UPPER(TRIM("name"))
    WHERE "name" != UPPER(TRIM("name"));
  `;

  console.log(`Объединено групп производителей: ${mergedCount}`);
  console.log(`Удалено избыточных записей производителей: ${deletedManufacturersCount}`);
  console.log(`Одиночных производителей переведено в UPPERCASE: ${singleManufacturersUpdated}`);
}

async function main() {
  console.log('Старт миграции слияния брендов и производителей...');
  await mergeBrands();
  await mergeManufacturers();
  console.log('\nМиграция слияния успешно завершена!');
}

main()
  .catch((err) => {
    console.error('Ошибка при слиянии данных:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

-- Изменение физического порядка колонок в таблице KeepaExport
-- Чтобы brandId шел сразу после sellerId, мы пересоздаем колонку createdAt,
-- так как новые колонки добавляются в конец таблицы.
-- Это безопасно перенесет createdAt в самый конец, оставив brandId перед ней.

-- 1. Переименовываем старую колонку
ALTER TABLE "KeepaExport" RENAME COLUMN "createdAt" TO "createdAt_old";

-- 2. Добавляем новую колонку (она встанет в конец таблицы)
ALTER TABLE "KeepaExport" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. Копируем существующие данные
UPDATE "KeepaExport" SET "createdAt" = "createdAt_old";

-- 4. Удаляем старую колонку
ALTER TABLE "KeepaExport" DROP COLUMN "createdAt_old";
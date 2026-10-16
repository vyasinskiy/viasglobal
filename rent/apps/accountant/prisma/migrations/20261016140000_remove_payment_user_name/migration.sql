-- Переносим имя пользователя в таблицу users, если оно не было заполнено, для исключения потери данных
UPDATE "users" u
SET "name" = p."user_name"
FROM "payments" p
WHERE p."user_id" = u."id" 
  AND (u."name" IS NULL OR u."name" = '') 
  AND p."user_name" IS NOT NULL;

-- Удаляем денормализованную колонку user_name из таблицы payments
ALTER TABLE "payments" DROP COLUMN IF EXISTS "user_name";

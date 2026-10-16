-- Добавляем колонку payment_date со значением по умолчанию CURRENT_TIMESTAMP
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Инициализируем payment_date значениями created_at для существующих записей
UPDATE "payments" SET "payment_date" = "created_at" WHERE "payment_date" = CURRENT_TIMESTAMP;

-- Создаем индекс для быстрой сортировки и фильтрации по дате платежа
CREATE INDEX IF NOT EXISTS "idx_payments_payment_date" ON "payments"("payment_date");

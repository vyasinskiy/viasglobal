-- Миграция синхронизации структуры БД с моделями Prisma (устранение дрифта схемы после восстановления из дампа)

-- 1. Таблица tenants: добавление даты начала аренды
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "rent_start_date" TIMESTAMP(3);

-- 2. Таблица invoices: поддержка инвойсов аренды и локального хранилища
ALTER TABLE "invoices" ALTER COLUMN "account_id" DROP NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "account_external_id" DROP NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoice_type" TEXT NOT NULL DEFAULT 'utility';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tenant_id" INTEGER;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "uploaded_to_storage" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='uploaded_to_s3') THEN
    UPDATE "invoices" SET "uploaded_to_storage" = "uploaded_to_s3" WHERE "uploaded_to_s3" IS NOT NULL;
    ALTER TABLE "invoices" DROP COLUMN "uploaded_to_s3";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "invoice_tenant_period_key" ON "invoices"("tenant_id", "period_id");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_tenant_id_fkey') THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 3. Таблица payments: привязка к банкам, дата операции и удаление дублирующего user_name
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "bank_id" INTEGER;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='user_name') THEN
    UPDATE "users" u SET "name" = p."user_name"
    FROM "payments" p
    WHERE p."user_id" = u."id" AND (u."name" IS NULL OR u."name" = '') AND p."user_name" IS NOT NULL;
    ALTER TABLE "payments" DROP COLUMN "user_name";
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_payments_bank_id" ON "payments"("bank_id");
CREATE INDEX IF NOT EXISTS "idx_payments_payment_date" ON "payments"("payment_date");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_bank_id_fkey') THEN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Таблица event_attachments: переименование s3_key в storage_key
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_attachments' AND column_name='s3_key') THEN
    ALTER TABLE "event_attachments" RENAME COLUMN "s3_key" TO "storage_key";
  END IF;
END $$;


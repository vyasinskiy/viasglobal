-- AlterTable tenants
ALTER TABLE "tenants" ADD COLUMN "rent_start_date" TIMESTAMP(3);

-- AlterTable invoices
ALTER TABLE "invoices" ALTER COLUMN "account_id" DROP NOT NULL;
ALTER TABLE "invoices" ALTER COLUMN "account_external_id" DROP NOT NULL;
ALTER TABLE "invoices" ADD COLUMN "invoice_type" TEXT NOT NULL DEFAULT 'utility';
ALTER TABLE "invoices" ADD COLUMN "tenant_id" INTEGER;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "invoice_tenant_period_key" ON "invoices"("tenant_id", "period_id");
-- CreateTable
CREATE TABLE "banks" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "banks_name_key" ON "banks"("name");

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "bank_id" INTEGER;

-- CreateIndex
CREATE INDEX "idx_payments_bank_id" ON "payments"("bank_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed banks
INSERT INTO "banks" ("name") VALUES ('Альфа-Банк') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "banks" ("name") VALUES ('Тинькофф') ON CONFLICT ("name") DO NOTHING;
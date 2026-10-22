-- AlterTable: Добавление поля ecoTasa в DistributorPriceSnapshot
ALTER TABLE "DistributorPriceSnapshot" ADD COLUMN IF NOT EXISTS "ecoTasa" DOUBLE PRECISION;

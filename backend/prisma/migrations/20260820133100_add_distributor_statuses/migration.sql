-- ==============================================================================
-- Миграция: add_distributor_statuses
-- Назначение: Добавление статусов воронки коммуникаций (DistributorStatus) и
--             контактных полей (email, phone, notes, lastContactAt, rejectionReason)
--             в таблицу Distributor.
-- ==============================================================================

-- CreateEnum
CREATE TYPE "DistributorStatus" AS ENUM ('NEW', 'FORM_SUBMITTED', 'EMAIL_SENT', 'CALLED', 'ACCOUNT_OPENED', 'REJECTED');

-- AlterTable
ALTER TABLE "Distributor" ADD COLUMN "email" TEXT,
ADD COLUMN "lastContactAt" TIMESTAMP(3),
ADD COLUMN "notes" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "status" "DistributorStatus" NOT NULL DEFAULT 'NEW';

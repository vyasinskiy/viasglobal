-- AlterTable: Добавление поля domains в Distributor
ALTER TABLE "Distributor" ADD COLUMN IF NOT EXISTS "domains" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable: Контактные лица и менеджеры дистрибьютора
CREATE TABLE IF NOT EXISTS "DistributorContact" (
    "id" SERIAL NOT NULL,
    "distributorId" INTEGER NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Сохраненные письма из переписки с поставщиком
CREATE TABLE IF NOT EXISTS "DistributorEmail" (
    "id" SERIAL NOT NULL,
    "distributorId" INTEGER,
    "messageId" TEXT NOT NULL,
    "uid" INTEGER,
    "folder" TEXT NOT NULL DEFAULT 'INBOX',
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "snippet" TEXT,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DistributorEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DistributorContact_distributorId_idx" ON "DistributorContact"("distributorId");
CREATE INDEX IF NOT EXISTS "DistributorContact_email_idx" ON "DistributorContact"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "DistributorEmail_messageId_key" ON "DistributorEmail"("messageId");
CREATE INDEX IF NOT EXISTS "DistributorEmail_distributorId_idx" ON "DistributorEmail"("distributorId");
CREATE INDEX IF NOT EXISTS "DistributorEmail_fromEmail_idx" ON "DistributorEmail"("fromEmail");
CREATE INDEX IF NOT EXISTS "DistributorEmail_date_idx" ON "DistributorEmail"("date" DESC);

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DistributorContact_distributorId_fkey'
    ) THEN
        ALTER TABLE "DistributorContact" ADD CONSTRAINT "DistributorContact_distributorId_fkey" 
            FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'DistributorEmail_distributorId_fkey'
    ) THEN
        ALTER TABLE "DistributorEmail" ADD CONSTRAINT "DistributorEmail_distributorId_fkey" 
            FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

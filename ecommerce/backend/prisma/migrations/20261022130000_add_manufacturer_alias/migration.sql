-- CreateTable
CREATE TABLE IF NOT EXISTS "ManufacturerAlias" (
    "id" SERIAL NOT NULL,
    "rawName" TEXT NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturerAlias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ManufacturerAlias_rawName_key" ON "ManufacturerAlias"("rawName");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ManufacturerAlias_manufacturerId_idx" ON "ManufacturerAlias"("manufacturerId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ManufacturerAlias_manufacturerId_fkey'
    ) THEN
        ALTER TABLE "ManufacturerAlias" 
        ADD CONSTRAINT "ManufacturerAlias_manufacturerId_fkey" 
        FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

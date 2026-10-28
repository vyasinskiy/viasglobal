-- CreateTable
CREATE TABLE "AsinSnapshot" (
    "id" SERIAL NOT NULL,
    "asinId" INTEGER NOT NULL,
    "buyBoxSeller" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsinSnapshot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AsinSnapshot" ADD CONSTRAINT "AsinSnapshot_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "ASIN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

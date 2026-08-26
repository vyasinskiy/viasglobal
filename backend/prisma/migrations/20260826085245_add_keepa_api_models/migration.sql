-- CreateTable
CREATE TABLE "WholesaleAsinQueue" (
    "id" SERIAL NOT NULL,
    "asin" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WholesaleAsinQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KeepaApiRawResponse" (
    "asin" TEXT NOT NULL,
    "rawPayload" JSONB,
    "fetchedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,

    CONSTRAINT "KeepaApiRawResponse_pkey" PRIMARY KEY ("asin")
);

-- CreateTable
CREATE TABLE "KeepaApiProcessedData" (
    "asin" TEXT NOT NULL,
    "packageLength" DOUBLE PRECISION,
    "packageWidth" DOUBLE PRECISION,
    "packageHeight" DOUBLE PRECISION,
    "packageWeight" DOUBLE PRECISION,
    "sizeTier" TEXT,
    "fbaFee" DOUBLE PRECISION,
    "lastProcessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeepaApiProcessedData_pkey" PRIMARY KEY ("asin")
);

-- CreateIndex
CREATE UNIQUE INDEX "WholesaleAsinQueue_asin_key" ON "WholesaleAsinQueue"("asin");

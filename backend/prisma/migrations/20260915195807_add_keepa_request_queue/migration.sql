-- CreateEnum
CREATE TYPE "KeepaRequestType" AS ENUM ('PRODUCT_ASINS', 'CATEGORY_FINDER', 'BRAND_FINDER', 'SELLER_FINDER');

-- CreateEnum
CREATE TYPE "KeepaRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "KeepaAllowedCategory" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "KeepaRequestQueue" (
    "id" SERIAL NOT NULL,
    "type" "KeepaRequestType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 10,
    "status" "KeepaRequestStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "expectedCost" INTEGER NOT NULL DEFAULT 1,
    "resultSummary" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "KeepaRequestQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KeepaRequestQueue_status_priority_createdAt_idx" ON "KeepaRequestQueue"("status", "priority", "createdAt");

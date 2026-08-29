-- AlterTable
ALTER TABLE "ASIN" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "AsinAnalysisQueue" (
    "asin" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AsinAnalysisQueue_pkey" PRIMARY KEY ("asin")
);

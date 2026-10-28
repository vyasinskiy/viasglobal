-- AlterTable
ALTER TABLE "KeepaApiProcessedData" ADD COLUMN     "buyBoxEligibleOfferCounts" JSONB,
ADD COLUMN     "buyBoxSellerIdHistory" JSONB,
ADD COLUMN     "eanList" TEXT[],
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "gtinList" TEXT[],
ADD COLUMN     "images" JSONB,
ADD COLUMN     "offers" JSONB,
ADD COLUMN     "upcList" TEXT[];

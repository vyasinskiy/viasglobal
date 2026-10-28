-- Переименование таблицы WholesaleAsinQueue в RequestProductQueue и ее ограничений/индексов
ALTER TABLE "WholesaleAsinQueue" RENAME TO "RequestProductQueue";
ALTER SEQUENCE IF EXISTS "WholesaleAsinQueue_id_seq" RENAME TO "RequestProductQueue_id_seq";
ALTER TABLE "RequestProductQueue" RENAME CONSTRAINT "WholesaleAsinQueue_pkey" TO "RequestProductQueue_pkey";
ALTER INDEX IF EXISTS "WholesaleAsinQueue_asin_key" RENAME TO "RequestProductQueue_asin_key";

-- Переименование таблицы AsinAnalysisQueue в AnalysisProductQueue и ее ограничений/индексов
ALTER TABLE "AsinAnalysisQueue" RENAME TO "AnalysisProductQueue";
ALTER TABLE "AnalysisProductQueue" RENAME CONSTRAINT "AsinAnalysisQueue_pkey" TO "AnalysisProductQueue_pkey";

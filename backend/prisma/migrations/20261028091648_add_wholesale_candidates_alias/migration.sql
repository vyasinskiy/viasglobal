-- AlterTable: убираем DEFAULT у updatedAt для консистентности Prisma
ALTER TABLE "DistributorContact" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "DistributorEmail" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ManufacturerAlias" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- ==============================================================================
-- Представление: WholesaleCandidatesView (Официальный алиас для CandidatesProductsView)
-- Назначение: Сводный анализ и группировка товаров ASIN по Производителю, Бренду,
--             Продавцу и причине фильтрации (filterReason) для отбора потенциальных
--             кандидатов под оптовую торговлю (Wholesale).
--             Автоматически исключает бренды в работе (status = 'CONTRACTED') 
--             и бренды без дистрибьюторов в ЕС (status = 'NO_EU_DISTRIBUTOR').
-- ==============================================================================

DROP VIEW IF EXISTS public."WholesaleCandidatesView";

CREATE OR REPLACE VIEW public."WholesaleCandidatesView" AS
SELECT * FROM public.get_candidates_products();

-- ==============================================================================
-- Обновление статуса бренда Safta на 'CONTRACTED'
-- Назначение: Так как Safta является официальным брендом в работе (Wholesale),
--             его товары перемещаются в ContractedFilteredProductsView / ContractedAllProductsView
--             и автоматически исключаются из выборки новых кандидатов (WholesaleCandidatesView).
-- ==============================================================================

UPDATE "Brand"
SET "status" = 'CONTRACTED', "updatedAt" = NOW()
WHERE UPPER("name") = 'SAFTA';

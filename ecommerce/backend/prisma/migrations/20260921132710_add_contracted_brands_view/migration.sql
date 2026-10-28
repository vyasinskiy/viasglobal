ALTER TYPE "BrandStatus" RENAME VALUE 'ACTIVE' TO 'UNPROCESSED';
ALTER TYPE "BrandStatus" ADD VALUE 'CONTRACTED';

DROP VIEW IF EXISTS public."WholesaleCandidatesView";
DROP FUNCTION IF EXISTS public.get_wholesale_candidates();

-- ==============================================================================
-- Функция: get_contracted_products
-- Назначение: Возвращает сводный список ASIN для "Брендов в работе"
--             (BrandStatus = 'CONTRACTED'). Использует более мягкие параметры 
--             фильтрации и не проверяет историю продавцов (FEW_BUYBOX_WINNERS).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_contracted_products(
    p_max_bsr INT DEFAULT 100000,
    p_max_amazon_buybox FLOAT DEFAULT 0.50
)
RETURNS TABLE (
    "manufacturer" TEXT,
    "brand" TEXT,
    "sellerName" TEXT,
    "filterReason" TEXT,
    "asinCount" INT,
    "asins" TEXT,
    "eans" TEXT,
    "distributors" TEXT,
    "brandId" INT,
    "sellerId" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
      m.name AS "manufacturer",
      b.name AS "brand",
      s.name AS "sellerName",
      NULL::TEXT AS "filterReason", -- Не используем жесткий фильтр get_asin_filter_reason для рабочих брендов
      COUNT(DISTINCT a.id)::INT AS "asinCount",
      string_agg(DISTINCT a.code, ', ') AS "asins",
      string_agg(DISTINCT s."productCodesEAN", ', ') AS "eans",
      string_agg(DISTINCT d.name, ', ') AS "distributors",
      a."brandId" AS "brandId",
      s."sellerId" AS "sellerId"
    FROM "ASIN" a
    JOIN "Brand" b ON a."brandId" = b.id
    JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    LEFT JOIN LATERAL (
        SELECT snap."sellerId", sel.name, snap."productCodesEAN", snap."salesRankCurrent", snap."buyBoxAmazon90Days", snap."buyBoxCurrent"
        FROM "ProductFinder" snap
        LEFT JOIN "Seller" sel ON snap."sellerId" = sel.id
        WHERE snap."asinId" = a.id
        ORDER BY snap."createdAt" DESC
        LIMIT 1
    ) s ON true
    LEFT JOIN "_ASINToDistributor" ad ON ad."A" = a.id
    LEFT JOIN "Distributor" d ON ad."B" = d.id
    WHERE s."salesRankCurrent" >= 1 AND s."salesRankCurrent" <= p_max_bsr
      AND (s."buyBoxAmazon90Days" IS NULL OR s."buyBoxAmazon90Days" = '' OR CAST(s."buyBoxAmazon90Days" AS FLOAT) <= p_max_amazon_buybox)
      AND s."buyBoxCurrent" >= 10
      AND NOT EXISTS (
        SELECT 1
        FROM "_ASINToTag" at
        JOIN "Tag" t ON t.id = at."B"
        WHERE at."A" = a.id AND t.name IN ('DEAD_VARIATION', 'MISSING_VARIATION')
      )
      AND b.status = 'CONTRACTED'
    GROUP BY 
      m.name, b.name, s.name, a."brandId", s."sellerId"
    ORDER BY 
      COUNT(DISTINCT a.id) DESC;
END;
$$ LANGUAGE plpgsql STABLE;
-- ==============================================================================
-- Представление: ContractedProductsView
-- Назначение: Сводное SQL-представление для отображения товаров брендов, 
--             находящихся в работе (BrandStatus = 'CONTRACTED').
-- ==============================================================================

DROP VIEW IF EXISTS public."ContractedProductsView";

CREATE OR REPLACE VIEW public."ContractedProductsView" AS
SELECT * FROM public.get_contracted_products();
-- ==============================================================================
-- Функция: get_candidates_products
-- Назначение: Возвращает сводный список ASIN для оптовой торговли с учетом
--             параметров фильтрации (BSR и процент владения BuyBox Amazon).
--             Возвращает таблицу (Table-Valued Function).
-- ==============================================================================



CREATE OR REPLACE FUNCTION public.get_candidates_products(
    p_max_bsr INT DEFAULT 50000,
    p_max_amazon_buybox FLOAT DEFAULT 0.10
)
RETURNS TABLE (
    "manufacturer" TEXT,
    "brand" TEXT,
    "sellerName" TEXT,
    "filterReason" TEXT,
    "asinCount" INT,
    "asins" TEXT,
    "eans" TEXT,
    "distributors" TEXT,
    "brandId" INT,
    "sellerId" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
      m.name AS "manufacturer",
      b.name AS "brand",
      s.name AS "sellerName",
      public.get_asin_filter_reason(a.id) AS "filterReason",
      COUNT(DISTINCT a.id)::INT AS "asinCount",
      string_agg(DISTINCT a.code, ', ') AS "asins",
      string_agg(DISTINCT s."productCodesEAN", ', ') AS "eans",
      string_agg(DISTINCT d.name, ', ') AS "distributors",
      a."brandId" AS "brandId",
      s."sellerId" AS "sellerId"
    FROM "ASIN" a
    JOIN "Brand" b ON a."brandId" = b.id
    JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    LEFT JOIN LATERAL (
        SELECT snap."sellerId", sel.name, snap."productCodesEAN", snap."salesRankCurrent", snap."buyBoxAmazon90Days", snap."buyBoxCurrent"
        FROM "ProductFinder" snap
        LEFT JOIN "Seller" sel ON snap."sellerId" = sel.id
        WHERE snap."asinId" = a.id
        ORDER BY snap."createdAt" DESC
        LIMIT 1
    ) s ON true
    LEFT JOIN "_ASINToDistributor" ad ON ad."A" = a.id
    LEFT JOIN "Distributor" d ON ad."B" = d.id
    WHERE s."salesRankCurrent" >= 1 AND s."salesRankCurrent" <= p_max_bsr
      AND (s."buyBoxAmazon90Days" IS NULL OR s."buyBoxAmazon90Days" = '' OR CAST(s."buyBoxAmazon90Days" AS FLOAT) <= p_max_amazon_buybox)
      AND s."buyBoxCurrent" >= 15
      AND NOT EXISTS (
        SELECT 1
        FROM "_ASINToTag" at
        JOIN "Tag" t ON t.id = at."B"
        WHERE at."A" = a.id AND t.name IN ('DEAD_VARIATION', 'MISSING_VARIATION')
      )
      AND b.status NOT IN ('NO_EU_DISTRIBUTOR', 'CONTRACTED')
    GROUP BY 
      m.name, b.name, s.name, public.get_asin_filter_reason(a.id), a."brandId", s."sellerId"
    ORDER BY 
      public.get_asin_filter_reason(a.id) ASC NULLS FIRST, 
      COUNT(DISTINCT a.id) DESC;
END;
$$ LANGUAGE plpgsql STABLE;
-- ==============================================================================
-- Представление: CandidatesProductsView
-- Назначение: Сводный анализ и группировка товаров ASIN по Производителю, Бренду,
--             Продавцу и причине фильтрации (filterReason) для отбора потенциальных
--             кандидатов под оптовую торговлю (Wholesale). Включает список привязанных дистрибьюторов и EAN.
-- ==============================================================================

DROP VIEW IF EXISTS public."CandidatesProductsView";

CREATE OR REPLACE VIEW public."CandidatesProductsView" AS
SELECT * FROM public.get_candidates_products();

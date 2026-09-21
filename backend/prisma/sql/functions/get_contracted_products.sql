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

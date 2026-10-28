-- ==============================================================================
-- Функция: get_candidates_products
-- Назначение: Возвращает сводный список брендов и производителей для оптовой торговли
--             (Wholesale) со схлопыванием селлеров в одну запись (sellerNames) и подсчетом
--             их количества (sellerCount), а также разделением на чистые (cleanAsinCount, cleanAsins)
--             и отфильтрованные товары (filterReasons).
--             Строго 1 запись на бренд и производителя.
--             Сортировка: сначала бренды с чистыми товарами (cleanAsinCount DESC),
--             затем отфильтрованные (cleanAsinCount = 0) по общему числу ASIN.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_candidates_products(
    p_max_bsr INT DEFAULT 50000,
    p_max_amazon_buybox FLOAT DEFAULT 0.10
)
RETURNS TABLE (
    "manufacturer" TEXT,
    "brand" TEXT,
    "sellerCount" INT,
    "sellerNames" TEXT,
    "cleanAsinCount" INT,
    "asinCount" INT,
    "filterReasons" TEXT,
    "cleanAsins" TEXT,
    "asins" TEXT,
    "eans" TEXT,
    "distributors" TEXT,
    "brandId" INT,
    "sellerIds" TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
      m.name AS "manufacturer",
      b.name AS "brand",
      COUNT(DISTINCT s."sellerId")::INT AS "sellerCount",
      string_agg(DISTINCT s.name, ', ') AS "sellerNames",
      COUNT(DISTINCT CASE WHEN public.get_asin_filter_reason(a.id) IS NULL THEN a.id END)::INT AS "cleanAsinCount",
      COUNT(DISTINCT a.id)::INT AS "asinCount",
      string_agg(DISTINCT public.get_asin_filter_reason(a.id), ', ') AS "filterReasons",
      string_agg(DISTINCT CASE WHEN public.get_asin_filter_reason(a.id) IS NULL THEN a.code END, ', ') AS "cleanAsins",
      string_agg(DISTINCT a.code, ', ') AS "asins",
      string_agg(DISTINCT s."productCodesEAN", ', ') AS "eans",
      string_agg(DISTINCT d.name, ', ') AS "distributors",
      a."brandId" AS "brandId",
      string_agg(DISTINCT s."sellerId", ', ') AS "sellerIds"
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
      m.name, b.name, a."brandId"
    ORDER BY 
      CASE WHEN COUNT(DISTINCT CASE WHEN public.get_asin_filter_reason(a.id) IS NULL THEN a.id END) > 0 THEN 0 ELSE 1 END ASC,
      COUNT(DISTINCT CASE WHEN public.get_asin_filter_reason(a.id) IS NULL THEN a.id END) DESC,
      COUNT(DISTINCT a.id) DESC,
      COUNT(DISTINCT s."sellerId") DESC;
END;
$$ LANGUAGE plpgsql STABLE;

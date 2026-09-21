-- Отвязываем старую View
DROP VIEW IF EXISTS public."ContractedProductsView";

-- Удаляем старую функцию, так как у нее поменялся тип возвращаемой таблицы
DROP FUNCTION IF EXISTS public.get_contracted_products(INT, FLOAT);

-- Создаем обновленную функцию без filterReason
CREATE OR REPLACE FUNCTION public.get_contracted_products(
    p_max_bsr INT DEFAULT 100000,
    p_max_amazon_buybox FLOAT DEFAULT 0.50
)
RETURNS TABLE (
    "brand" TEXT,
    "asinCount" INT,
    "asins" TEXT,
    "eans" TEXT,
    "distributors" TEXT,
    "brandId" INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
      b.name AS "brand",
      COUNT(DISTINCT a.id)::INT AS "asinCount",
      string_agg(DISTINCT a.code, ', ') AS "asins",
      string_agg(DISTINCT s."productCodesEAN", ', ') AS "eans",
      string_agg(DISTINCT d.name, ', ') AS "distributors",
      a."brandId" AS "brandId"
    FROM "ASIN" a
    JOIN "Brand" b ON a."brandId" = b.id
    LEFT JOIN LATERAL (
        SELECT snap."productCodesEAN", snap."salesRankCurrent", snap."buyBoxAmazon90Days", snap."buyBoxCurrent"
        FROM "ProductFinder" snap
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
      b.name, a."brandId"
    ORDER BY 
      COUNT(DISTINCT a.id) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Восстанавливаем View
CREATE OR REPLACE VIEW public."ContractedProductsView" AS
SELECT * FROM public.get_contracted_products();
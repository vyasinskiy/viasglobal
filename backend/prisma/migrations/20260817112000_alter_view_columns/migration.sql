DROP VIEW IF EXISTS "FilteredAsinResultsView";
-- Drop old overloaded function so Postgres can resolve the one with DEFAULT 80
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(integer);

CREATE OR REPLACE VIEW "FilteredAsinResultsView" AS
SELECT
  m.name AS "manufacturer",
  b.name AS "brand",
  s.name AS "sellerName",
  public.get_asin_filter_reason(a.id) AS "filterReason",
  COUNT(a.id)::INT AS "asinCount",
  string_agg(a.code, ', ') AS "asins",
  a."brandId" AS "brandId",
  s."sellerId" AS "sellerId"
FROM "ASIN" a
JOIN "Brand" b ON a."brandId" = b.id
JOIN "Manufacturer" m ON a."manufacturerId" = m.id
LEFT JOIN LATERAL (
    SELECT snap."sellerId", sel.name
    FROM "ProductFinder" snap
    LEFT JOIN "Seller" sel ON snap."sellerId" = sel.id
    WHERE snap."asinId" = a.id
    ORDER BY snap."createdAt" DESC
    LIMIT 1
) s ON true
GROUP BY 
  m.name, 
  b.name, 
  s.name, 
  public.get_asin_filter_reason(a.id), 
  a."brandId", 
  s."sellerId"
ORDER BY 
  public.get_asin_filter_reason(a.id) ASC NULLS FIRST, 
  COUNT(a.id) DESC;
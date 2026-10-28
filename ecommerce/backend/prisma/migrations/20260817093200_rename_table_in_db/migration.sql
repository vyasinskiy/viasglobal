-- Drop dependent objects
DROP VIEW IF EXISTS "FilteredAsinResultsView";
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(INT, INT);
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(INT);

-- Rename table and its constraints/indexes
ALTER TABLE "AsinSnapshot" RENAME TO "ProductFinder";
ALTER SEQUENCE IF EXISTS "AsinSnapshot_id_seq" RENAME TO "ProductFinder_id_seq";
ALTER TABLE "ProductFinder" RENAME CONSTRAINT "AsinSnapshot_pkey" TO "ProductFinder_pkey";
ALTER TABLE "ProductFinder" RENAME CONSTRAINT "AsinSnapshot_asinId_fkey" TO "ProductFinder_asinId_fkey";
ALTER TABLE "ProductFinder" RENAME CONSTRAINT "AsinSnapshot_sellerId_fkey" TO "ProductFinder_sellerId_fkey";
ALTER INDEX IF EXISTS "AsinSnapshot_pkey" RENAME TO "ProductFinder_pkey";

-- Recreate function
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(p_asin_id INT)
RETURNS TEXT AS $$
DECLARE
    v_brand_name TEXT;
    v_manufacturer_name TEXT;
    v_buybox_seller TEXT;
    v_is_private BOOLEAN;
BEGIN
    -- Get related brand and manufacturer info
    SELECT b.name, m.name
    INTO v_brand_name, v_manufacturer_name
    FROM "ASIN" a
    LEFT JOIN "Brand" b ON a."brandId" = b.id
    LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    WHERE a.id = p_asin_id;

    -- Check if it's a private label
    SELECT EXISTS (
        SELECT 1 FROM "PrivateLabel" pl
        JOIN "ASIN" a ON pl."brandId" = a."brandId" AND pl."manufacturerId" = a."manufacturerId"
        WHERE a.id = p_asin_id
    ) INTO v_is_private;

    IF v_is_private THEN
        RETURN 'PRIVATE_LABEL';
    END IF;

    -- Get the latest snapshot from ProductFinder instead of AsinSnapshot
    SELECT "buyBoxSeller"
    INTO v_buybox_seller
    FROM "ProductFinder"
    WHERE "asinId" = p_asin_id
    ORDER BY "createdAt" DESC
    LIMIT 1;

    -- If no data
    IF v_buybox_seller IS NULL OR v_buybox_seller = '' THEN
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    -- Check brand match
    IF v_brand_name IS NOT NULL AND v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    -- Check manufacturer match
    IF v_manufacturer_name IS NOT NULL AND v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
        RETURN 'BUYBOX_MATCH_MANUFACTURER';
    END IF;

    RETURN 'OK';
END;
$$ LANGUAGE plpgsql;

-- Recreate view
CREATE OR REPLACE VIEW "FilteredAsinResultsView" AS
SELECT
  m.name AS "manufacturer",
  b.name AS "brand",
  s."sellerId",
  s.name AS "sellerName",
  public.get_asin_filter_reason(a.id) AS "filterReason",
  COUNT(a.id)::INT AS "asinCount",
  string_agg(a.code, ', ') AS "asins"
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
  s."sellerId",
  s.name,
  public.get_asin_filter_reason(a.id)
ORDER BY
  public.get_asin_filter_reason(a.id) ASC NULLS FIRST,
  COUNT(a.id) DESC;

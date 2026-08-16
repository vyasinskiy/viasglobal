DROP VIEW IF EXISTS "FilteredAsinResultsView";
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(integer, integer);

CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(p_asin_id INT, p_dominant_threshold INT DEFAULT 80)
RETURNS TEXT AS $$
DECLARE
    v_is_private_label BOOLEAN;
    v_buybox_seller TEXT;
    v_brand_name TEXT;
    v_manufacturer_name TEXT;
    v_brand_id INT;
    v_manufacturer_id INT;
    v_seller_id TEXT;
    v_seller_percentage INT;
    v_total_asins INT;
    v_seller_asins INT;
    v_seller_share FLOAT;
BEGIN
    -- 1. Check if the ASIN belongs to a Private Label
    SELECT 
        CASE WHEN pl.id IS NOT NULL THEN true ELSE false END,
        b.name,
        m.name,
        a."brandId",
        a."manufacturerId"
    INTO 
        v_is_private_label, 
        v_brand_name, 
        v_manufacturer_name,
        v_brand_id,
        v_manufacturer_id
    FROM "ASIN" a
    LEFT JOIN "Brand" b ON a."brandId" = b.id
    LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    LEFT JOIN "PrivateLabel" pl ON pl."brandId" = a."brandId" AND pl."manufacturerId" = a."manufacturerId"
    WHERE a.id = p_asin_id;

    IF v_is_private_label THEN
        RETURN 'PRIVATE_LABEL';
    END IF;

    -- 2. Get the latest BuyBox Seller from the snapshots
    SELECT "buyBoxSeller"
    INTO v_buybox_seller
    FROM "AsinSnapshot"
    WHERE "asinId" = p_asin_id
    ORDER BY "createdAt" DESC
    LIMIT 1;

    -- If no snapshot data found
    IF v_buybox_seller IS NULL THEN
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    -- 3. DOMINANT SELLER CHECK
    -- Extract percentage from string like "Pulchlla (100%) / API5SQCLMSM0Q" -> "100"
    v_seller_percentage := substring(v_buybox_seller from '\((\d+)%\)')::INT;
    
    -- Extract seller ID from string (after the " / ")
    v_seller_id := trim(split_part(v_buybox_seller, ' / ', 2));

    -- If the seller holds >= p_dominant_threshold on this ASIN and we successfully extracted an ID
    IF v_seller_percentage IS NOT NULL AND v_seller_percentage >= p_dominant_threshold AND v_seller_id <> '' THEN
        
        -- Count total ASINs for this Brand+Manufacturer
        SELECT count(*)
        INTO v_total_asins
        FROM "ASIN"
        WHERE "brandId" = v_brand_id AND "manufacturerId" = v_manufacturer_id;

        IF v_total_asins > 0 THEN
            -- Count how many of those ASINs are dominated by the SAME seller ID
            SELECT count(*)
            INTO v_seller_asins
            FROM "ASIN" a2
            JOIN LATERAL (
                SELECT "buyBoxSeller"
                FROM "AsinSnapshot" snap
                WHERE snap."asinId" = a2.id
                ORDER BY snap."createdAt" DESC
                LIMIT 1
            ) latest_snap ON true
            WHERE a2."brandId" = v_brand_id 
              AND a2."manufacturerId" = v_manufacturer_id
              AND trim(split_part(latest_snap."buyBoxSeller", ' / ', 2)) = v_seller_id;

            v_seller_share := (v_seller_asins::FLOAT / v_total_asins) * 100.0;

            IF v_seller_share >= p_dominant_threshold THEN
                RETURN 'DOMINANT_SELLER';
            END IF;
        END IF;
    END IF;

    -- 4. Standard Name Matching Checks
    IF v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    IF v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
        RETURN 'BUYBOX_MATCH_MANUFACTURER';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW "FilteredAsinResultsView" AS
SELECT
  m.name AS "manufacturer",
  b.name AS "brand",
  public.get_asin_filter_reason(a.id) AS "filterReason",
  COUNT(a.id)::INT AS "asinCount",
  string_agg(a.code, ', ') AS "asins"
FROM "ASIN" a
JOIN "Brand" b ON a."brandId" = b.id
JOIN "Manufacturer" m ON a."manufacturerId" = m.id
GROUP BY
  m.name,
  b.name,
  public.get_asin_filter_reason(a.id)
ORDER BY
  public.get_asin_filter_reason(a.id) ASC NULLS FIRST,
  COUNT(a.id) DESC;

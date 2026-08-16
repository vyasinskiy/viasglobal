-- Create function to determine filtering reason
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

    -- Get the latest snapshot
    SELECT "buyBoxSeller"
    INTO v_buybox_seller
    FROM "AsinSnapshot"
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

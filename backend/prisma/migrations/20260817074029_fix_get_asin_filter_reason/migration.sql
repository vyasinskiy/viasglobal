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
    -- 1. Get the latest BuyBox Seller from the snapshots
    SELECT "buyBoxSeller", "sellerId", "sellerPercentage"
    INTO v_buybox_seller, v_seller_id, v_seller_percentage
    FROM "ProductFinder"
    WHERE "asinId" = p_asin_id
    ORDER BY "createdAt" DESC
    LIMIT 1;

    -- If no snapshot data found
    IF v_buybox_seller IS NULL THEN
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    -- If sellerId is NULL, we fallback to parsing (for old snapshots)
    IF v_seller_id IS NULL THEN
        v_seller_percentage := substring(v_buybox_seller from '\((\d+)%\)')::INT;
        v_seller_id := trim(split_part(v_buybox_seller, ' / ', 2));
    END IF;

    -- 2. Check if the ASIN belongs to a Private Label
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
    LEFT JOIN "PrivateLabel" pl ON pl."brandId" = a."brandId" AND pl."sellerId" = v_seller_id
    WHERE a.id = p_asin_id;

    IF v_is_private_label THEN
        RETURN 'PRIVATE_LABEL';
    END IF;

    -- 3. DOMINANT SELLER CHECK
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
                SELECT "sellerId", "buyBoxSeller"
                FROM "ProductFinder" snap
                WHERE snap."asinId" = a2.id
                ORDER BY snap."createdAt" DESC
                LIMIT 1
            ) latest_snap ON true
            WHERE a2."brandId" = v_brand_id 
              AND a2."manufacturerId" = v_manufacturer_id
              AND (latest_snap."sellerId" = v_seller_id OR trim(split_part(latest_snap."buyBoxSeller", ' / ', 2)) = v_seller_id);

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


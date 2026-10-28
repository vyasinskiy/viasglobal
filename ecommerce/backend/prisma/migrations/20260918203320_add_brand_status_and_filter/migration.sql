-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('ACTIVE', 'NO_EU_DISTRIBUTOR');

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "BrandStatus" NOT NULL DEFAULT 'ACTIVE';

-- ==============================================================================
-- Функция: get_asin_filter_reason
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(
    p_asin_id INT, 
    p_dominant_threshold INT DEFAULT 90, 
    p_min_winner_count INT DEFAULT 4
)
RETURNS TEXT AS $$
DECLARE
    v_input_asin_id INT := p_asin_id;
    v_dominant_threshold INT := p_dominant_threshold;
    v_min_winner_count INT := p_min_winner_count;

    v_is_private_label BOOLEAN;
    v_buybox_seller TEXT;
    v_brand_name TEXT;
    v_manufacturer_name TEXT;
    v_brand_id INT;
    v_brand_status TEXT;
    v_manufacturer_id INT;
    v_seller_id TEXT;
    v_top_seller_90days FLOAT;
    v_winner_count_90days INT;
    v_effective_threshold FLOAT;
BEGIN
    IF v_dominant_threshold > 1 THEN
        v_effective_threshold := v_dominant_threshold::FLOAT / 100.0;
    ELSE
        v_effective_threshold := v_dominant_threshold::FLOAT;
    END IF;

    -- 1. Получаем базовые данные о товаре (Бренд и Производитель)
    SELECT 
        b.name,
        m.name,
        a."brandId",
        b.status::TEXT,
        a."manufacturerId"
    INTO 
        v_brand_name, 
        v_manufacturer_name,
        v_brand_id,
        v_brand_status,
        v_manufacturer_id
    FROM "ASIN" a
    LEFT JOIN "Brand" b ON a."brandId" = b.id
    LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    WHERE a.id = v_input_asin_id;

    -- Если у бренда статус NO_EU_DISTRIBUTOR, сразу отсеиваем товар
    IF v_brand_status = 'NO_EU_DISTRIBUTOR' THEN
        RAISE NOTICE 'DEBUG [ASIN %]: NO_EU_DISTRIBUTOR', v_input_asin_id;
        RETURN 'NO_EU_DISTRIBUTOR';
    END IF;

    -- Получаем самого актуального продавца в BuyBox и метрики из снапшотов (ProductFinder)
    SELECT 
        "buyBoxSeller", 
        "sellerId", 
        "buyBoxTopSeller90Days", 
        "buyBoxWinnerCount90Days"
    INTO 
        v_buybox_seller, 
        v_seller_id, 
        v_top_seller_90days, 
        v_winner_count_90days
    FROM "ProductFinder"
    WHERE "asinId" = v_input_asin_id
    ORDER BY "createdAt" DESC
    LIMIT 1;

    IF v_buybox_seller IS NULL THEN
        RAISE NOTICE 'DEBUG [ASIN %]: NO_BUYBOX_DATA', v_input_asin_id;
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    IF v_seller_id IS NULL THEN
        v_seller_id := trim(split_part(v_buybox_seller, ' / ', 2));
    END IF;

    RAISE NOTICE 'DEBUG [ASIN %]: sellerId=%, buyboxSeller="%", winnerCount90Days=%, minWinnerCount=%, topSeller90Days=%, threshold=%, effectiveThreshold=%', 
        v_input_asin_id, 
        COALESCE(v_seller_id, 'NULL'), 
        v_buybox_seller, 
        COALESCE(v_winner_count_90days::TEXT, 'NULL'), 
        v_min_winner_count, 
        COALESCE(v_top_seller_90days::TEXT, 'NULL'), 
        v_dominant_threshold,
        v_effective_threshold;

    -- 2. СТАНДАРТНЫЕ ТЕКСТОВЫЕ ПРОВЕРКИ
    IF v_brand_name IS NOT NULL AND v_brand_name <> '' AND v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RAISE NOTICE 'DEBUG [ASIN %]: BUYBOX_MATCH_BRAND', v_input_asin_id;
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    IF v_manufacturer_name IS NOT NULL AND v_manufacturer_name <> '' AND v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
        RAISE NOTICE 'DEBUG [ASIN %]: BUYBOX_MATCH_MANUFACTURER', v_input_asin_id;
        RETURN 'BUYBOX_MATCH_MANUFACTURER';
    END IF;

    -- 3. ПРОВЕРКА НА ПРИВАТНЫЙ ЛЕЙБЛ (Поиск в таблице PrivateLabel)
    IF v_brand_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_seller_id <> '' THEN
        SELECT CASE WHEN id IS NOT NULL THEN true ELSE false END
        INTO v_is_private_label
        FROM "PrivateLabel"
        WHERE "brandId" = v_brand_id AND "sellerId" = v_seller_id
        LIMIT 1;

        IF v_is_private_label THEN
            RAISE NOTICE 'DEBUG [ASIN %]: PRIVATE_LABEL', v_input_asin_id;
            RETURN 'PRIVATE_LABEL';
        END IF;

        IF public.check_brand_seller_dominance(v_brand_id, v_seller_id, 80) THEN
            RAISE NOTICE 'DEBUG [ASIN %]: DOMINANT_BRAND_SELLER', v_input_asin_id;
            RETURN 'DOMINANT_BRAND_SELLER';
        END IF;
    END IF;

    -- 4. ПРОВЕРКА НА КОЛИЧЕСТВО ПОБЕДИТЕЛЕЙ BUYBOX ЗА 90 ДНЕЙ
    IF v_winner_count_90days IS NOT NULL AND v_winner_count_90days < v_min_winner_count THEN
        RAISE NOTICE 'DEBUG [ASIN %]: FEW_BUYBOX_WINNERS (winnerCount=% < min=%)', v_input_asin_id, v_winner_count_90days, v_min_winner_count;
        RETURN 'FEW_BUYBOX_WINNERS';
    END IF;

    -- 5. ПРОВЕРКА НА ДОМИНИРОВАНИЕ ТОПОВОГО ПРОДАВЦА ЗА 90 ДНЕЙ
    IF v_top_seller_90days IS NOT NULL AND v_top_seller_90days >= v_effective_threshold THEN
        RAISE NOTICE 'DEBUG [ASIN %]: DOMINANT_BUY_BOX_SELLER (topSeller=% >= threshold=%)', v_input_asin_id, v_top_seller_90days, v_effective_threshold;
        RETURN 'DOMINANT_BUY_BOX_SELLER';
    END IF;

    RAISE NOTICE 'DEBUG [ASIN %]: CLEAN (RETURN NULL)', v_input_asin_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- Функция: get_wholesale_candidates
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_wholesale_candidates(
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
      AND b.status != 'NO_EU_DISTRIBUTOR'
    GROUP BY 
      m.name, b.name, s.name, public.get_asin_filter_reason(a.id), a."brandId", s."sellerId"
    ORDER BY 
      public.get_asin_filter_reason(a.id) ASC NULLS FIRST, 
      COUNT(DISTINCT a.id) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- Представление: WholesaleCandidatesView
-- ==============================================================================

DROP VIEW IF EXISTS public."WholesaleCandidatesView";

CREATE OR REPLACE VIEW public."WholesaleCandidatesView" AS
SELECT * FROM public.get_wholesale_candidates();


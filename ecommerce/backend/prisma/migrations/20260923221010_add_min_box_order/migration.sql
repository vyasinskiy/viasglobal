
-- AlterTable
ALTER TABLE "DistributorPriceSnapshot" ADD COLUMN IF NOT EXISTS "minBoxOrder" INTEGER;

-- Drop views to recreate them with new columns
DROP VIEW IF EXISTS "ContractedFilteredProductsView";
DROP VIEW IF EXISTS "ContractedProductsView";
DROP VIEW IF EXISTS "ContractedAllProductsView";

-- Drop functions to recreate them with new return types
DROP FUNCTION IF EXISTS public.get_contracted_all_products(boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_contracted_products(int, float, boolean) CASCADE;

-- Update functions
-- ==============================================================================
-- Функция: get_contracted_all_products
-- Назначение: Возвращает поштучный список ВСЕХ товаров брендов со статусом CONTRACTED
--             без каких-либо фильтров по BSR, цене или доле присутствия Amazon.
--             Рассчитывает себестоимость закупки (costPrice / grossPrice), комиссии Amazon,
--             НДС на комиссии (vatOnFees 21% для режима Recargo de Equivalencia),
--             чистую прибыль (netProfit), ROI (%) и маржинальность (margin %).
--             Результат отсортирован по убыванию потенциальной прибыли.
-- Параметры:
--   p_include_vat_on_fees BOOLEAN DEFAULT TRUE - Учитывать ли 21% НДС на комиссии в расходах (для режима Recargo = TRUE, для SL с вычетом = FALSE)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_contracted_all_products(
    p_include_vat_on_fees BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    "asin" TEXT,
    "ean" TEXT,
    "salesRank" INT,
    "netProfit" FLOAT,
    "minBoxOrderGross" FLOAT,
    "minBoxOrder" INT,
    "unitsPerBox" INT,
    "netPrice" FLOAT,
    "grossPrice" FLOAT,
    "costPrice" FLOAT,
    "title" TEXT,
    "brand" TEXT,
    "distributor" TEXT,
    "buyBoxPrice" FLOAT,
    "fbaFee" FLOAT,
    "referralFee" FLOAT,
    "amazonFees" FLOAT,
    "vatOnFees" FLOAT,
    "roiPercent" FLOAT,
    "marginPercent" FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_snapshots AS (
        -- Получаем самый свежий снапшот ProductFinder для каждого ASIN
        SELECT DISTINCT ON (snap."asinId")
            snap."asinId",
            snap."title",
            snap."productCodesEAN",
            snap."salesRankCurrent",
            snap."buyBoxAmazon90Days",
            snap."buyBoxCurrent",
            snap."newCurrent",
            snap."fBAPickPackFee",
            snap."referralFee",
            snap."referralFeeBasedOnCurrentBuyBoxPrice"
        FROM "ProductFinder" snap
        ORDER BY snap."asinId", snap."createdAt" DESC
    ),
    latest_distributor_prices AS (
        -- Получаем самый свежий снапшот цены поставщика для каждого ASIN
        SELECT DISTINCT ON (dp."asinId")
            dp."asinId",
            dp."priceNetto",
            dp."costPrice",
            dp."unitsPerBox",
            dp."minBoxOrder",
            d.name AS "distributorName"
        FROM "DistributorPriceSnapshot" dp
        JOIN "Distributor" d ON dp."distributorId" = d.id
        WHERE dp."asinId" IS NOT NULL
        ORDER BY dp."asinId", dp."createdAt" DESC
    ),
    calc AS (
        SELECT
            a.id AS calc_asin_id,
            a.code::TEXT AS calc_asin,
            COALESCE(s."productCodesEAN", '')::TEXT AS calc_ean,
            s."title"::TEXT AS calc_title,
            b.name::TEXT AS calc_brand,
            COALESCE(dp."distributorName", d_rel.name, '')::TEXT AS calc_distributor,
            dp."unitsPerBox"::INT AS calc_units_per_box,
            dp."minBoxOrder"::INT AS calc_min_box_order,
            (dp."costPrice" * COALESCE(dp."minBoxOrder", dp."unitsPerBox", 1))::FLOAT AS calc_min_box_order_gross,
            dp."priceNetto"::FLOAT AS calc_price_netto,
            dp."costPrice"::FLOAT AS calc_cost_price,
            LEAST(s."buyBoxCurrent", s."newCurrent")::FLOAT AS calc_buy_box_price,
            s."fBAPickPackFee"::FLOAT AS calc_fba_fee,
            CASE 
                WHEN s."referralFee" IS NOT NULL AND s."referralFee" > 0 AND LEAST(s."buyBoxCurrent", s."newCurrent") IS NOT NULL 
                THEN ROUND((LEAST(s."buyBoxCurrent", s."newCurrent") * s."referralFee")::numeric, 2)
                ELSE s."referralFeeBasedOnCurrentBuyBoxPrice"
            END::FLOAT AS calc_referral_fee,
            s."salesRankCurrent"::INT AS calc_sales_rank
        FROM "ASIN" a
        JOIN "Brand" b ON a."brandId" = b.id
        LEFT JOIN latest_snapshots s ON s."asinId" = a.id
        LEFT JOIN latest_distributor_prices dp ON dp."asinId" = a.id
        LEFT JOIN LATERAL (
            SELECT dist.name 
            FROM "_ASINToDistributor" ad
            JOIN "Distributor" dist ON ad."B" = dist.id
            WHERE ad."A" = a.id
            LIMIT 1
        ) d_rel ON true
        WHERE b.status = 'CONTRACTED'
    ),
    fees_calc AS (
        SELECT
            c.*,
            (COALESCE(c.calc_fba_fee, 0) + COALESCE(c.calc_referral_fee, 0))::FLOAT AS base_amazon_fees,
            -- НДС на комиссии Amazon (21% IVA при авто-реперкуссии в Modelo 309 на режиме Recargo)
            ROUND(((COALESCE(c.calc_fba_fee, 0) + COALESCE(c.calc_referral_fee, 0)) * 0.21)::numeric, 2)::FLOAT AS calc_vat_on_fees
        FROM calc c
    )
    SELECT
        f.calc_asin AS "asin",
        f.calc_ean AS "ean",
        f.calc_sales_rank AS "salesRank",
        -- Чистая расчетная прибыль на единицу:
        -- BuyBox - Amazon Fees - (VAT on fees, если режим Recargo) - Закупка с налогами
        CASE 
            WHEN f.calc_cost_price IS NOT NULL AND f.calc_buy_box_price IS NOT NULL 
            THEN ROUND((
                f.calc_buy_box_price 
                - f.base_amazon_fees 
                - (CASE WHEN p_include_vat_on_fees THEN f.calc_vat_on_fees ELSE 0 END)
                - f.calc_cost_price
            )::numeric, 2)::FLOAT
            ELSE NULL
        END AS "netProfit",
        f.calc_min_box_order_gross AS "minBoxOrderGross",
        f.calc_min_box_order AS "minBoxOrder",
        f.calc_units_per_box AS "unitsPerBox",
        f.calc_price_netto AS "netPrice",
        f.calc_cost_price AS "grossPrice",
        f.calc_cost_price AS "costPrice",
        f.calc_title AS "title",
        f.calc_brand AS "brand",
        f.calc_distributor AS "distributor",
        f.calc_buy_box_price AS "buyBoxPrice",
        f.calc_fba_fee AS "fbaFee",
        f.calc_referral_fee AS "referralFee",
        -- Суммарные комиссии Amazon (чистые комиссии без НДС)
        f.base_amazon_fees AS "amazonFees",
        -- 21% НДС на комиссии Amazon
        f.calc_vat_on_fees AS "vatOnFees",
        -- Рентабельность ROI (%): (Net Profit / Gross Price) * 100
        CASE 
            WHEN f.calc_cost_price IS NOT NULL AND f.calc_cost_price > 0 AND f.calc_buy_box_price IS NOT NULL
            THEN ROUND((
                (f.calc_buy_box_price 
                - f.base_amazon_fees 
                - (CASE WHEN p_include_vat_on_fees THEN f.calc_vat_on_fees ELSE 0 END)
                - f.calc_cost_price) / f.calc_cost_price * 100.0
            )::numeric, 2)::FLOAT
            ELSE NULL
        END AS "roiPercent",
        -- Маржинальность Margin (%): (Net Profit / Buy Box Price) * 100
        CASE 
            WHEN f.calc_cost_price IS NOT NULL AND f.calc_buy_box_price IS NOT NULL AND f.calc_buy_box_price > 0
            THEN ROUND((
                (f.calc_buy_box_price 
                - f.base_amazon_fees 
                - (CASE WHEN p_include_vat_on_fees THEN f.calc_vat_on_fees ELSE 0 END)
                - f.calc_cost_price) / f.calc_buy_box_price * 100.0
            )::numeric, 2)::FLOAT
            ELSE NULL
        END AS "marginPercent"
    FROM fees_calc f
    ORDER BY 
        -- Сортировка: сначала товары с максимальной чистой прибылью, затем по BSR
        "netProfit" DESC NULLS LAST,
        f.calc_sales_rank ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;


-- ==============================================================================
-- Функция: get_contracted_products
-- Назначение: Возвращает поштучный список товаров брендов со статусом CONTRACTED
--             с расчетом себестоимости закупки (costPrice / grossPrice), комиссий Amazon,
--             НДС на комиссии (vatOnFees 21% для режима Recargo de Equivalencia),
--             чистой прибыли (netProfit), ROI (%) и маржинальности (margin %).
--             Результат отсортирован по убыванию потенциальной прибыли.
-- Параметры:
--   p_max_bsr INT DEFAULT 100000            - Максимальный Sales Rank (BSR)
--   p_max_amazon_buybox FLOAT DEFAULT 0.50  - Доля нахождения Amazon в BuyBox (до 50%)
--   p_include_vat_on_fees BOOLEAN DEFAULT TRUE - Учитывать ли 21% НДС на комиссии в расходах (для режима Recargo = TRUE, для SL с вычетом = FALSE)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_contracted_products(
    p_max_bsr INT DEFAULT 100000,
    p_max_amazon_buybox FLOAT DEFAULT 0.50,
    p_include_vat_on_fees BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    "asinId" INT,
    "asin" TEXT,
    "ean" TEXT,
    "salesRank" INT,
    "netProfit" FLOAT,
    "minBoxOrderGross" FLOAT,
    "minBoxOrder" INT,
    "unitsPerBox" INT,
    "netPrice" FLOAT,
    "grossPrice" FLOAT,
    "costPrice" FLOAT,
    "title" TEXT,
    "brand" TEXT,
    "distributor" TEXT,
    "buyBoxPrice" FLOAT,
    "fbaFee" FLOAT,
    "referralFee" FLOAT,
    "amazonFees" FLOAT,
    "vatOnFees" FLOAT,
    "roiPercent" FLOAT,
    "marginPercent" FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_snapshots AS (
        -- Получаем самый свежий снапшот ProductFinder для каждого ASIN
        SELECT DISTINCT ON (snap."asinId")
            snap."asinId",
            snap."title",
            snap."productCodesEAN",
            snap."salesRankCurrent",
            snap."buyBoxAmazon90Days",
            snap."buyBoxCurrent",
            snap."newCurrent",
            snap."fBAPickPackFee",
            snap."referralFee",
            snap."referralFeeBasedOnCurrentBuyBoxPrice"
        FROM "ProductFinder" snap
        ORDER BY snap."asinId", snap."createdAt" DESC
    ),
    latest_distributor_prices AS (
        -- Получаем самый свежий снапшот цены поставщика для каждого ASIN
        SELECT DISTINCT ON (dp."asinId")
            dp."asinId",
            dp."priceNetto",
            dp."costPrice",
            dp."unitsPerBox",
            dp."minBoxOrder",
            d.name AS "distributorName"
        FROM "DistributorPriceSnapshot" dp
        JOIN "Distributor" d ON dp."distributorId" = d.id
        WHERE dp."asinId" IS NOT NULL
        ORDER BY dp."asinId", dp."createdAt" DESC
    ),
    calc AS (
        SELECT
            a.id AS calc_asin_id,
            a.code::TEXT AS calc_asin,
            COALESCE(s."productCodesEAN", '')::TEXT AS calc_ean,
            s."title"::TEXT AS calc_title,
            b.name::TEXT AS calc_brand,
            COALESCE(dp."distributorName", d_rel.name, '')::TEXT AS calc_distributor,
            dp."unitsPerBox"::INT AS calc_units_per_box,
            dp."minBoxOrder"::INT AS calc_min_box_order,
            (dp."costPrice" * COALESCE(dp."minBoxOrder", dp."unitsPerBox", 1))::FLOAT AS calc_min_box_order_gross,
            dp."priceNetto"::FLOAT AS calc_price_netto,
            dp."costPrice"::FLOAT AS calc_cost_price,
            LEAST(s."buyBoxCurrent", s."newCurrent")::FLOAT AS calc_buy_box_price,
            s."fBAPickPackFee"::FLOAT AS calc_fba_fee,
            CASE 
                WHEN s."referralFee" IS NOT NULL AND s."referralFee" > 0 AND LEAST(s."buyBoxCurrent", s."newCurrent") IS NOT NULL 
                THEN ROUND((LEAST(s."buyBoxCurrent", s."newCurrent") * s."referralFee")::numeric, 2)
                ELSE s."referralFeeBasedOnCurrentBuyBoxPrice"
            END::FLOAT AS calc_referral_fee,
            s."salesRankCurrent"::INT AS calc_sales_rank
        FROM "ASIN" a
        JOIN "Brand" b ON a."brandId" = b.id
        JOIN latest_snapshots s ON s."asinId" = a.id
        LEFT JOIN latest_distributor_prices dp ON dp."asinId" = a.id
        -- Если прямого снапшота цены еще нет, пробуем получить имя связанного дистрибьютора
        LEFT JOIN LATERAL (
            SELECT dist.name 
            FROM "_ASINToDistributor" ad
            JOIN "Distributor" dist ON ad."B" = dist.id
            WHERE ad."A" = a.id
            LIMIT 1
        ) d_rel ON true
        WHERE b.status = 'CONTRACTED'
          AND s."salesRankCurrent" >= 1 AND s."salesRankCurrent" <= p_max_bsr
          AND (s."buyBoxAmazon90Days" IS NULL OR s."buyBoxAmazon90Days" = '' OR CAST(s."buyBoxAmazon90Days" AS FLOAT) <= p_max_amazon_buybox)
          AND LEAST(s."buyBoxCurrent", s."newCurrent") >= 10
          -- Исключаем мертвые вариации
          AND NOT EXISTS (
            SELECT 1
            FROM "_ASINToTag" at
            JOIN "Tag" t ON t.id = at."B"
            WHERE at."A" = a.id AND t.name IN ('DEAD_VARIATION', 'MISSING_VARIATION')
          )
    ),
    fees_calc AS (
        SELECT
            c.*,
            (COALESCE(c.calc_fba_fee, 0) + COALESCE(c.calc_referral_fee, 0))::FLOAT AS base_amazon_fees,
            -- НДС на комиссии Amazon (21% IVA при авто-реперкуссии в Modelo 309 на режиме Recargo)
            ROUND(((COALESCE(c.calc_fba_fee, 0) + COALESCE(c.calc_referral_fee, 0)) * 0.21)::numeric, 2)::FLOAT AS calc_vat_on_fees
        FROM calc c
    )
    SELECT
        f.calc_asin_id AS "asinId",
        f.calc_asin AS "asin",
        f.calc_ean AS "ean",
        f.calc_sales_rank AS "salesRank",
        -- Чистая расчетная прибыль на единицу:
        -- BuyBox - Amazon Fees - (VAT on fees, если режим Recargo) - Закупка с налогами
        CASE 
            WHEN f.calc_cost_price IS NOT NULL 
            THEN ROUND((
                f.calc_buy_box_price 
                - f.base_amazon_fees 
                - (CASE WHEN p_include_vat_on_fees THEN f.calc_vat_on_fees ELSE 0 END)
                - f.calc_cost_price
            )::numeric, 2)::FLOAT
            ELSE NULL
        END AS "netProfit",
        f.calc_min_box_order_gross AS "minBoxOrderGross",
        f.calc_min_box_order AS "minBoxOrder",
        f.calc_units_per_box AS "unitsPerBox",
        f.calc_price_netto AS "netPrice",
        f.calc_cost_price AS "grossPrice",
        f.calc_cost_price AS "costPrice",
        f.calc_title AS "title",
        f.calc_brand AS "brand",
        f.calc_distributor AS "distributor",
        f.calc_buy_box_price AS "buyBoxPrice",
        f.calc_fba_fee AS "fbaFee",
        f.calc_referral_fee AS "referralFee",
        -- Суммарные комиссии Amazon (чистые комиссии без НДС)
        f.base_amazon_fees AS "amazonFees",
        -- 21% НДС на комиссии Amazon
        f.calc_vat_on_fees AS "vatOnFees",
        -- Рентабельность ROI (%): (Net Profit / Gross Price) * 100
        CASE 
            WHEN f.calc_cost_price IS NOT NULL AND f.calc_cost_price > 0
            THEN ROUND((
                (f.calc_buy_box_price 
                - f.base_amazon_fees 
                - (CASE WHEN p_include_vat_on_fees THEN f.calc_vat_on_fees ELSE 0 END)
                - f.calc_cost_price) / f.calc_cost_price * 100.0
            )::numeric, 2)::FLOAT
            ELSE NULL
        END AS "roiPercent",
        -- Маржинальность Margin (%): (Net Profit / Buy Box Price) * 100
        CASE 
            WHEN f.calc_cost_price IS NOT NULL AND f.calc_buy_box_price > 0
            THEN ROUND((
                (f.calc_buy_box_price 
                - f.base_amazon_fees 
                - (CASE WHEN p_include_vat_on_fees THEN f.calc_vat_on_fees ELSE 0 END)
                - f.calc_cost_price) / f.calc_buy_box_price * 100.0
            )::numeric, 2)::FLOAT
            ELSE NULL
        END AS "marginPercent"
    FROM fees_calc f
    ORDER BY 
        -- Сортировка: сначала товары с максимальной чистой прибылью, затем по BSR
        "netProfit" DESC NULLS LAST,
        f.calc_sales_rank ASC;
END;
$$ LANGUAGE plpgsql STABLE;


-- Recreate views
CREATE VIEW "ContractedAllProductsView" AS
SELECT * FROM public.get_contracted_all_products(TRUE);

CREATE VIEW "ContractedProductsView" AS
SELECT * FROM public.get_contracted_products(100000, 0.50, TRUE);

CREATE VIEW "ContractedFilteredProductsView" AS
SELECT * FROM public.get_contracted_products(100000, 0.50, TRUE)
WHERE "buyBoxPrice" >= 10;

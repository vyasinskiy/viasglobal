-- Drop view first to allow updating the function return type
DROP VIEW IF EXISTS public."ContractedProductsView";

-- Drop existing function to change return type and signature
DROP FUNCTION IF EXISTS public.get_contracted_products(INT, FLOAT);
DROP FUNCTION IF EXISTS public.get_contracted_products(INT, FLOAT, BOOLEAN);

-- Create updated function with netPrice, grossPrice and vatOnFees (21% IVA on Amazon Fees for Recargo de Equivalencia)
CREATE OR REPLACE FUNCTION public.get_contracted_products(
    p_max_bsr INT DEFAULT 100000,
    p_max_amazon_buybox FLOAT DEFAULT 0.50,
    p_include_vat_on_fees BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    "asinId" INT,
    "asin" TEXT,
    "ean" TEXT,
    "title" TEXT,
    "brand" TEXT,
    "distributor" TEXT,
    "netPrice" FLOAT,
    "grossPrice" FLOAT,
    "costPrice" FLOAT,
    "buyBoxPrice" FLOAT,
    "fbaFee" FLOAT,
    "referralFee" FLOAT,
    "amazonFees" FLOAT,
    "vatOnFees" FLOAT,
    "netProfit" FLOAT,
    "roiPercent" FLOAT,
    "marginPercent" FLOAT,
    "salesRank" INT
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
            dp."priceNetto"::FLOAT AS calc_price_netto,
            dp."costPrice"::FLOAT AS calc_cost_price,
            s."buyBoxCurrent"::FLOAT AS calc_buy_box_price,
            s."fBAPickPackFee"::FLOAT AS calc_fba_fee,
            COALESCE(
                s."referralFeeBasedOnCurrentBuyBoxPrice",
                CASE 
                    WHEN s."referralFee" IS NOT NULL AND s."referralFee" > 0 AND s."buyBoxCurrent" IS NOT NULL 
                    THEN ROUND((s."buyBoxCurrent" * s."referralFee")::numeric, 2)
                    ELSE NULL
                END
            )::FLOAT AS calc_referral_fee,
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
          AND s."buyBoxCurrent" >= 10
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
        f.calc_title AS "title",
        f.calc_brand AS "brand",
        f.calc_distributor AS "distributor",
        f.calc_price_netto AS "netPrice",
        f.calc_cost_price AS "grossPrice",
        f.calc_cost_price AS "costPrice",
        f.calc_buy_box_price AS "buyBoxPrice",
        f.calc_fba_fee AS "fbaFee",
        f.calc_referral_fee AS "referralFee",
        -- Суммарные комиссии Amazon (чистые комиссии без НДС)
        f.base_amazon_fees AS "amazonFees",
        -- 21% НДС на комиссии Amazon
        f.calc_vat_on_fees AS "vatOnFees",
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
        END AS "marginPercent",
        f.calc_sales_rank AS "salesRank"
    FROM fees_calc f
    ORDER BY 
        -- Сортировка: сначала товары с максимальной чистой прибылью, затем по BSR
        "netProfit" DESC NULLS LAST,
        f.calc_sales_rank ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Recreate view ContractedProductsView (по умолчанию p_include_vat_on_fees = true для режима Recargo)
CREATE OR REPLACE VIEW public."ContractedProductsView" AS
SELECT * FROM public.get_contracted_products();
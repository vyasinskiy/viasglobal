-- Migration: 20260922171705_add_contracted_filtered_and_all_views
-- Описание: Добавление представлений ContractedFilteredProductsView (с оптовыми фильтрами)
--            и ContractedAllProductsView (все товары бренда в работе без ограничений).

-- 1. Удаляем представления при наличии
DROP VIEW IF EXISTS public."ContractedAllProductsView";
DROP VIEW IF EXISTS public."ContractedFilteredProductsView";

-- 2. Создаем функцию get_contracted_all_products
CREATE OR REPLACE FUNCTION public.get_contracted_all_products(
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
        f.base_amazon_fees AS "amazonFees",
        f.calc_vat_on_fees AS "vatOnFees",
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
        CASE 
            WHEN f.calc_cost_price IS NOT NULL AND f.calc_buy_box_price IS NOT NULL AND f.calc_buy_box_price > 0
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
        "netProfit" DESC NULLS LAST,
        f.calc_sales_rank ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Создаем представление ContractedFilteredProductsView (с оптовыми фильтрами)
CREATE OR REPLACE VIEW public."ContractedFilteredProductsView" AS
SELECT * FROM public.get_contracted_products();

-- 4. Создаем представление ContractedAllProductsView (все товары без ограничений)
CREATE OR REPLACE VIEW public."ContractedAllProductsView" AS
SELECT * FROM public.get_contracted_all_products();
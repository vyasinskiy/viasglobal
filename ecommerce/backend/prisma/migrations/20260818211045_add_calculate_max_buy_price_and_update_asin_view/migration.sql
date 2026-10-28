-- ==============================================================================
-- Миграция: add_calculate_max_buy_price_and_update_asin_view
-- Назначение: 
--   1. Создание хранимой функции calculate_max_buy_price для автоматического
--      вычисления максимальной закупочной цены товара (под 10% маржи по умолчанию).
--   2. Обновление представления AsinView (с предварительным DROP VIEW для изменения структуры колонок):
--      - переименование price -> buyBoxPrice
--      - удаление лишних колонок
--      - добавление колонки maxBuyPrice
-- ==============================================================================

-- 1. Создание функции calculate_max_buy_price (по ID ASIN)
CREATE OR REPLACE FUNCTION public.calculate_max_buy_price(
    p_asin_id INT,
    p_target_margin_pct FLOAT DEFAULT 10.0,
    p_inbound_shipping FLOAT DEFAULT 0.40,
    p_vat_rate FLOAT DEFAULT 21.0
)
RETURNS FLOAT AS $$
DECLARE
    v_asin_id INT := p_asin_id;
    v_target_margin_pct FLOAT := p_target_margin_pct;
    v_inbound_shipping FLOAT := p_inbound_shipping;
    v_vat_rate FLOAT := p_vat_rate;

    v_buybox_price FLOAT;
    v_fba_fee FLOAT;
    v_referral_fee_pct FLOAT;
    v_referral_fee_euro FLOAT;

    v_net_selling_price FLOAT;
    v_effective_referral_fee FLOAT;
    v_net_payout FLOAT;
    v_target_margin_euro FLOAT;
    v_max_buy_price FLOAT;
BEGIN
    SELECT 
        pf."buyBoxCurrent",
        pf."fBAPickPackFee",
        pf."referralFee",
        pf."referralFeeBasedOnCurrentBuyBoxPrice"
    INTO 
        v_buybox_price,
        v_fba_fee,
        v_referral_fee_pct,
        v_referral_fee_euro
    FROM "ProductFinder" pf
    WHERE pf."asinId" = v_asin_id
    ORDER BY pf."createdAt" DESC
    LIMIT 1;

    IF v_buybox_price IS NULL OR v_buybox_price <= 0 THEN
        RETURN NULL;
    END IF;

    -- Чистая цена продажи без НДС (Net Selling Price)
    v_net_selling_price := v_buybox_price / (1.0 + (v_vat_rate / 100.0));

    -- Реферальная комиссия Amazon в евро
    IF v_referral_fee_euro IS NOT NULL AND v_referral_fee_euro > 0 THEN
        v_effective_referral_fee := v_referral_fee_euro;
    ELSIF v_referral_fee_pct IS NOT NULL AND v_referral_fee_pct > 0 THEN
        v_effective_referral_fee := v_buybox_price * v_referral_fee_pct;
    ELSE
        -- По умолчанию берем стандартную ставку 15% для большинства категорий
        v_effective_referral_fee := v_buybox_price * 0.15;
    END IF;

    -- Если нет комиссии FBA, расчет неполный
    IF v_fba_fee IS NULL THEN
        RETURN NULL;
    END IF;

    -- Чистый остаток продавцу после вычетов Amazon и входящей доставки
    v_net_payout := v_net_selling_price - v_effective_referral_fee - v_fba_fee - v_inbound_shipping;

    -- Целевая чистая маржа в евро (10% по умолчанию)
    v_target_margin_euro := v_net_selling_price * (v_target_margin_pct / 100.0);

    -- Максимальная цена закупки
    v_max_buy_price := v_net_payout - v_target_margin_euro;

    IF v_max_buy_price < 0 THEN
        RETURN 0.00;
    END IF;

    RETURN ROUND(v_max_buy_price::numeric, 2)::FLOAT;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Перегрузка функции calculate_max_buy_price (по строковому коду ASIN)
CREATE OR REPLACE FUNCTION public.calculate_max_buy_price(
    p_asin_code TEXT,
    p_target_margin_pct FLOAT DEFAULT 10.0,
    p_inbound_shipping FLOAT DEFAULT 0.40,
    p_vat_rate FLOAT DEFAULT 21.0
)
RETURNS FLOAT AS $$
DECLARE
    v_input_asin_code TEXT := p_asin_code;
    v_asin_id INT;
BEGIN
    SELECT id INTO v_asin_id FROM "ASIN" WHERE code = v_input_asin_code LIMIT 1;

    IF v_asin_id IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN public.calculate_max_buy_price(v_asin_id, p_target_margin_pct, p_inbound_shipping, p_vat_rate);
END;
$$ LANGUAGE plpgsql STABLE;

-- 3. Удаление старого представления AsinView перед пересозданием (обязательно при изменении состава колонок в PostgreSQL)
DROP VIEW IF EXISTS public."AsinView";

-- 4. Создание обновленного представления AsinView
CREATE OR REPLACE VIEW public."AsinView" AS
SELECT
  -- Идентификатор ASIN
  a.id AS "id",
  -- Код товара ASIN
  a.code AS "asin",
  -- Название бренда
  b.name AS "brand",
  -- Имя продавца (из связанной таблицы Seller)
  sel.name AS "seller",
  -- Текущая цена BuyBox из последнего снапшота Keepa
  latest."buyBoxCurrent" AS "buyBoxPrice",
  -- Расчетная максимальная цена оптовой закупки под 10% маржи
  public.calculate_max_buy_price(a.id) AS "maxBuyPrice"
FROM "ASIN" a
LEFT JOIN "Brand" b ON a."brandId" = b.id
LEFT JOIN LATERAL (
  SELECT 
    pf."sellerId",
    pf."buyBoxCurrent"
  FROM "ProductFinder" pf
  WHERE pf."asinId" = a.id
  ORDER BY pf."createdAt" DESC
  LIMIT 1
) latest ON true
LEFT JOIN "Seller" sel ON latest."sellerId" = sel.id
ORDER BY a.id ASC;
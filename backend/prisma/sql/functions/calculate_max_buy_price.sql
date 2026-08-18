-- ==============================================================================
-- Функция: calculate_max_buy_price
-- Назначение: Вычисление максимальной оптовой цены закупки товара (Max Buy Price)
--             на основе цены BuyBox, комиссий Amazon (FBA, Referral Fee),
--             вычета НДС (IVA) и желаемой чистой маржинальности.
-- Аргументы:
--   p_asin_id INT              - ID товара ASIN в таблице ASIN
--   p_target_margin_pct FLOAT  - Целевая чистая маржа в % (по умолчанию 10.0%)
--   p_inbound_shipping FLOAT   - Доставка до склада Amazon в € на 1 шт (по умолчанию 0.40 €)
--   p_vat_rate FLOAT           - Ставка НДС в % (по умолчанию 21.0% для Испании)
-- Возвращает:
--   FLOAT - Максимальная цена закупки у поставщика (Netto, без НДС) или NULL
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.calculate_max_buy_price(
    p_asin_id INT,
    p_target_margin_pct FLOAT DEFAULT 10.0,
    p_inbound_shipping FLOAT DEFAULT 0.40,
    p_vat_rate FLOAT DEFAULT 21.0
)
RETURNS FLOAT AS $$
DECLARE
    -- Входные переменные для отладки
    v_asin_id INT := p_asin_id;
    v_target_margin_pct FLOAT := p_target_margin_pct;
    v_inbound_shipping FLOAT := p_inbound_shipping;
    v_vat_rate FLOAT := p_vat_rate;

    -- Данные из последнего снапшота Keepa
    v_buybox_price FLOAT;
    v_fba_fee FLOAT;
    v_referral_fee_pct FLOAT;
    v_referral_fee_euro FLOAT;

    -- Промежуточные расчетные переменные
    v_net_selling_price FLOAT;
    v_effective_referral_fee FLOAT;
    v_net_payout FLOAT;
    v_target_margin_euro FLOAT;
    v_max_buy_price FLOAT;
BEGIN
    -- 1. Получаем актуальные данные по цене и комиссиям из последнего снапшота ProductFinder
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

    -- Если нет данных о цене продажи (BuyBox) или базовой комиссии FBA, расчет невозможен
    IF v_buybox_price IS NULL OR v_buybox_price <= 0 THEN
        RETURN NULL;
    END IF;

    -- 2. Вычисляем чистую цену продажи без НДС (Net Selling Price)
    -- Формула: Gross Price / (1 + VAT / 100)
    v_net_selling_price := v_buybox_price / (1.0 + (v_vat_rate / 100.0));

    -- 3. Определяем реферальную комиссию Amazon (Referral Fee) в евро
    IF v_referral_fee_euro IS NOT NULL AND v_referral_fee_euro > 0 THEN
        v_effective_referral_fee := v_referral_fee_euro;
    ELSIF v_referral_fee_pct IS NOT NULL AND v_referral_fee_pct > 0 THEN
        v_effective_referral_fee := v_buybox_price * v_referral_fee_pct;
    ELSE
        -- По умолчанию берем стандартную ставку 15% для большинства категорий
        v_effective_referral_fee := v_buybox_price * 0.15;
    END IF;

    -- 4. Если комиссия FBA отсутствует в снапшоте, расчет неполный (возвращаем NULL)
    IF v_fba_fee IS NULL THEN
        RETURN NULL;
    END IF;

    -- 5. Вычисляем чистый остаток продавцу после вычетов Amazon и входящей логистики (Net Payout)
    v_net_payout := v_net_selling_price - v_effective_referral_fee - v_fba_fee - v_inbound_shipping;

    -- 6. Вычисляем желаемую чистую маржу в евро от чистой выручки
    v_target_margin_euro := v_net_selling_price * (v_target_margin_pct / 100.0);

    -- 7. Максимальная цена закупки = Остаток после Amazon - Желаемая прибыль
    v_max_buy_price := v_net_payout - v_target_margin_euro;

    -- Если максимальная цена закупки отрицательная (товар убыточен даже при бесплатном товаре), возвращаем 0.00
    IF v_max_buy_price < 0 THEN
        RETURN 0.00;
    END IF;

    -- Округляем до двух знаков после запятой
    RETURN ROUND(v_max_buy_price::numeric, 2)::FLOAT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- Перегрузка: calculate_max_buy_price(p_asin_code TEXT, ...)
-- Назначение: Вызов функции расчета по строковому коду ASIN (например, 'B0CW6FMW5M')
-- ==============================================================================

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
    -- Находим ID ASIN по строковому коду
    SELECT id INTO v_asin_id FROM "ASIN" WHERE code = v_input_asin_code LIMIT 1;

    IF v_asin_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Передаем вызов в основную функцию
    RETURN public.calculate_max_buy_price(v_asin_id, p_target_margin_pct, p_inbound_shipping, p_vat_rate);
END;
$$ LANGUAGE plpgsql STABLE;

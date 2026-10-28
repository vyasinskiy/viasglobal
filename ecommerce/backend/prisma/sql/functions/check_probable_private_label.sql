-- ==============================================================================
-- Функция: check_probable_private_label
-- Назначение: Проверка вероятного приватного лейбла для связки Бренд + Производитель.
--             Вычисляет долю ASIN-ов, на которых данный продавец доминирует в BuyBox.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_probable_private_label(
    p_brand_id INT, 
    p_manufacturer_id INT, 
    p_seller_id TEXT, 
    p_dominant_threshold INT DEFAULT 90,
    p_min_winner_count INT DEFAULT 4
)
RETURNS BOOLEAN AS $$
DECLARE
    v_total_asins INT;
    v_dominant_asins INT;
    v_dominant_share FLOAT;
BEGIN
    -- Считаем общее количество ASIN-ов у этой связки Бренд + Производитель в нашей базе
    SELECT count(*)
    INTO v_total_asins
    FROM "ASIN"
    WHERE "brandId" = p_brand_id AND "manufacturerId" = p_manufacturer_id;

    -- Если таких ASIN-ов нет, вернуть false
    IF v_total_asins = 0 THEN
        RETURN false;
    END IF;

    -- Считаем количество ASIN-ов, где этот конкретный продавец сидит в BuyBox
    -- И базовая функция помечает этот ASIN как DOMINANT_BUY_BOX_SELLER или FEW_BUYBOX_WINNERS
    SELECT count(*)
    INTO v_dominant_asins
    FROM "ASIN" a2
    JOIN LATERAL (
        SELECT "sellerId", "buyBoxSeller"
        FROM "ProductFinder" snap
        WHERE snap."asinId" = a2.id
        ORDER BY snap."createdAt" DESC
        LIMIT 1
    ) latest_snap ON true
    WHERE a2."brandId" = p_brand_id 
      AND a2."manufacturerId" = p_manufacturer_id
      AND (latest_snap."sellerId" = p_seller_id OR trim(split_part(latest_snap."buyBoxSeller", ' / ', 2)) = p_seller_id)
      AND public.get_asin_filter_reason(a2.id, p_dominant_threshold, p_min_winner_count) IN ('DOMINANT_BUY_BOX_SELLER', 'FEW_BUYBOX_WINNERS');

    -- Вычисляем долю (процент) "доминирующих" ASIN-ов
    v_dominant_share := (v_dominant_asins::FLOAT / v_total_asins) * 100.0;

    -- Возвращаем true, если доля доминирования >= порога (по умолчанию 90%)
    RETURN v_dominant_share >= p_dominant_threshold;
END;
$$ LANGUAGE plpgsql STABLE;

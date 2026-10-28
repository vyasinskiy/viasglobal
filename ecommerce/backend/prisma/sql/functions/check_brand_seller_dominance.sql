-- ==============================================================================
-- Функция: check_brand_seller_dominance
-- Назначение: Проверка доминирования продавца на уровне каталога всего бренда (Macro Dominance).
--             Вычисляет долю товаров бренда, на которых целевой продавец удерживает Buy Box.
--             Требует наличия двух выгрузок Keepa: по бренду и по продавцу.
--             Если выгрузок нет в БД, функция возвращает false (без выбрасывания ошибок),
--             чтобы не блокировать фоновую фильтрацию ASIN на сырых данных.
-- Аргументы:
--   p_brand_id INT                 - ID бренда в таблице Brand
--   p_seller_id TEXT               - ID продавца в таблице Seller
--   p_dominant_threshold FLOAT     - Порог доминирования в каталоге бренда (по умолчанию 80%)
-- Возвращает:
--   BOOLEAN - true, если продавец доминирует в каталоге бренда при наличии обеих выгрузок, иначе false
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_brand_seller_dominance(
    p_brand_id INT, 
    p_seller_id TEXT, 
    p_dominant_threshold FLOAT DEFAULT 80
)
RETURNS BOOLEAN AS $$
DECLARE
    -- Входные переменные состояния
    v_has_brand_export BOOLEAN := false;
    v_has_seller_export BOOLEAN := false;
    v_total_brand_asins INT := 0;
    v_seller_brand_asins INT := 0;
    v_effective_threshold FLOAT;
BEGIN
    -- Проверка входных данных
    IF p_brand_id IS NULL OR p_seller_id IS NULL OR trim(p_seller_id) = '' THEN
        RETURN false;
    END IF;

    -- Приводим порог к долям единицы (0.0 .. 1.0)
    IF p_dominant_threshold > 1.0 THEN
        v_effective_threshold := p_dominant_threshold / 100.0;
    ELSE
        v_effective_threshold := p_dominant_threshold;
    END IF;

    -- 1. Проверяем наличие отдельных выгрузок Keepa по бренду и по продавцу
    SELECT EXISTS(
        SELECT 1 FROM "KeepaExport" WHERE "brandId" = p_brand_id
    ) INTO v_has_brand_export;

    SELECT EXISTS(
        SELECT 1 FROM "KeepaExport" WHERE "sellerId" = p_seller_id
    ) INTO v_has_seller_export;

    -- 2. Если хотя бы одной выгрузки нет, возвращаем false (недостаточно данных для подтверждения доминирования на уровне каталога)
    IF NOT v_has_brand_export OR NOT v_has_seller_export THEN
        RETURN false;
    END IF;

    -- 3. Считаем общее количество товаров бренда в базе данных
    SELECT COUNT(DISTINCT a.id)
    INTO v_total_brand_asins
    FROM "ASIN" a
    WHERE a."brandId" = p_brand_id;

    -- Если товаров бренда меньше 3, данных для анализа каталога недостаточно
    IF v_total_brand_asins < 3 THEN
        RETURN false;
    END IF;

    -- 4. Считаем количество товаров бренда, где в актуальном Buy Box сидит целевой продавец
    SELECT COUNT(DISTINCT a.id)
    INTO v_seller_brand_asins
    FROM "ASIN" a
    JOIN LATERAL (
        SELECT "sellerId", "buyBoxSeller"
        FROM "ProductFinder" pf
        WHERE pf."asinId" = a.id
        ORDER BY pf."createdAt" DESC
        LIMIT 1
    ) snap ON true
    WHERE a."brandId" = p_brand_id
      AND (snap."sellerId" = p_seller_id OR trim(split_part(snap."buyBoxSeller", ' / ', 2)) = p_seller_id);

    -- 5. Проверяем долю доминирования продавца над каталогом бренда
    RETURN (v_seller_brand_asins::FLOAT / v_total_brand_asins::FLOAT) >= v_effective_threshold;
END;
$$ LANGUAGE plpgsql STABLE;

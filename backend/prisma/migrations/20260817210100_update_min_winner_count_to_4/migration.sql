-- Обновление порога минимального количества победителей BuyBox:
-- Изменение p_min_winner_count по умолчанию с 3 на 4 (условие: v_winner_count_90days < 4, т.е. <= 3 отсеиваются как FEW_BUYBOX_WINNERS).

CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(
    p_asin_id INT, 
    p_dominant_threshold INT DEFAULT 90, 
    p_min_winner_count INT DEFAULT 4
)
RETURNS TEXT AS $$
DECLARE
    -- Входные параметры, скопированные в переменные для удобства отладки в pgAdmin (Local Variables)
    v_input_asin_id INT := p_asin_id;
    v_dominant_threshold INT := p_dominant_threshold;
    v_min_winner_count INT := p_min_winner_count;

    -- Локальные переменные состояния
    v_is_private_label BOOLEAN;
    v_buybox_seller TEXT;
    v_brand_name TEXT;
    v_manufacturer_name TEXT;
    v_brand_id INT;
    v_manufacturer_id INT;
    v_seller_id TEXT;
    v_top_seller_90days FLOAT;
    v_winner_count_90days INT;
BEGIN
    -- 1. Получаем базовые данные о товаре (Бренд и Производитель)
    SELECT 
        b.name,
        m.name,
        a."brandId",
        a."manufacturerId"
    INTO 
        v_brand_name, 
        v_manufacturer_name,
        v_brand_id,
        v_manufacturer_id
    FROM "ASIN" a
    LEFT JOIN "Brand" b ON a."brandId" = b.id
    LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
    WHERE a.id = v_input_asin_id;

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

    -- Если данных о BuyBox для этого товара нет вообще
    IF v_buybox_seller IS NULL THEN
        RAISE NOTICE 'DEBUG [ASIN %]: NO_BUYBOX_DATA', v_input_asin_id;
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    -- Если sellerId пустой, пытаемся вытащить ID из текстового поля buyBoxSeller
    IF v_seller_id IS NULL THEN
        v_seller_id := trim(split_part(v_buybox_seller, ' / ', 2));
    END IF;

    -- Логирование всех переменных для отладки (вкладка Messages в pgAdmin)
    RAISE NOTICE 'DEBUG [ASIN %]: sellerId=%, buyboxSeller="%", winnerCount90Days=%, minWinnerCount=%, topSeller90Days=%, threshold=%', 
        v_input_asin_id, 
        COALESCE(v_seller_id, 'NULL'), 
        v_buybox_seller, 
        COALESCE(v_winner_count_90days::TEXT, 'NULL'), 
        v_min_winner_count, 
        COALESCE(v_top_seller_90days::TEXT, 'NULL'), 
        v_dominant_threshold;

    -- 2. СТАНДАРТНЫЕ ТЕКСТОВЫЕ ПРОВЕРКИ (Выполняем до тяжелых проверок)
    -- Если имя продавца содержит в себе имя бренда
    IF v_brand_name IS NOT NULL AND v_brand_name <> '' AND v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RAISE NOTICE 'DEBUG [ASIN %]: BUYBOX_MATCH_BRAND', v_input_asin_id;
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    -- Если имя продавца содержит в себе имя производителя
    IF v_manufacturer_name IS NOT NULL AND v_manufacturer_name <> '' AND v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
        RAISE NOTICE 'DEBUG [ASIN %]: BUYBOX_MATCH_MANUFACTURER', v_input_asin_id;
        RETURN 'BUYBOX_MATCH_MANUFACTURER';
    END IF;

    -- 3. ПРОВЕРКА НА ПРИВАТНЫЙ ЛЕЙБЛ (Поиск в таблице PrivateLabel)
    -- Проверяем наличие подтвержденной связки Бренд + Продавец
    IF v_brand_id IS NOT NULL AND v_seller_id IS NOT NULL AND v_seller_id <> '' THEN
        SELECT CASE WHEN id IS NOT NULL THEN true ELSE false END
        INTO v_is_private_label
        FROM "PrivateLabel"
        WHERE "brandId" = v_brand_id AND "sellerId" = v_seller_id
        LIMIT 1;

        -- Если это подтвержденный приватный лейбл, сразу отсеиваем товар
        IF v_is_private_label THEN
            RAISE NOTICE 'DEBUG [ASIN %]: PRIVATE_LABEL', v_input_asin_id;
            RETURN 'PRIVATE_LABEL';
        END IF;
    END IF;

    -- 4. ПРОВЕРКА НА КОЛИЧЕСТВО ПОБЕДИТЕЛЕЙ BUYBOX ЗА 90 ДНЕЙ (Критерий: победителей должно быть строго >= 4, т.е. < 4 или <= 3 отсеиваются)
    IF v_winner_count_90days IS NOT NULL AND v_winner_count_90days < v_min_winner_count THEN
        RAISE NOTICE 'DEBUG [ASIN %]: FEW_BUYBOX_WINNERS (winnerCount=% < min=%)', v_input_asin_id, v_winner_count_90days, v_min_winner_count;
        RETURN 'FEW_BUYBOX_WINNERS';
    END IF;

    -- 5. ПРОВЕРКА НА ДОМИНИРОВАНИЕ ТОПОВОГО ПРОДАВЦА ЗА 90 ДНЕЙ
    -- Если один топовый продавец удерживал BuyBox >= порога (по умолчанию 90%), листинг монополизирован
    IF v_top_seller_90days IS NOT NULL AND v_top_seller_90days >= v_dominant_threshold THEN
        RAISE NOTICE 'DEBUG [ASIN %]: DOMINANT_BUY_BOX_SELLER (topSeller=% >= threshold=%)', v_input_asin_id, v_top_seller_90days, v_dominant_threshold;
        RETURN 'DOMINANT_BUY_BOX_SELLER';
    END IF;

    -- Если ни один фильтр не сработал, товар подходит (чистый), возвращаем NULL
    RAISE NOTICE 'DEBUG [ASIN %]: CLEAN (RETURN NULL)', v_input_asin_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Перегруженная функция для поиска по строковому коду ASIN (например, 'B0CP218ZLS')
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(
    p_asin_code TEXT, 
    p_dominant_threshold INT DEFAULT 90, 
    p_min_winner_count INT DEFAULT 4
)
RETURNS TEXT AS $$
DECLARE
    -- Входные параметры, скопированные в переменные для удобства отладки в pgAdmin (Local Variables)
    v_input_asin_code TEXT := p_asin_code;
    v_dominant_threshold INT := p_dominant_threshold;
    v_min_winner_count INT := p_min_winner_count;
    v_asin_id INT;
BEGIN
    -- Находим ID ASIN-а по его строковому коду
    SELECT id INTO v_asin_id FROM "ASIN" WHERE code = v_input_asin_code LIMIT 1;
    
    IF v_asin_id IS NULL THEN
        RAISE NOTICE 'DEBUG [ASIN_CODE %]: ASIN_NOT_FOUND', v_input_asin_code;
        RETURN 'ASIN_NOT_FOUND';
    END IF;
    
    -- Передаем вызов в основную функцию
    RETURN public.get_asin_filter_reason(v_asin_id, v_dominant_threshold, v_min_winner_count);
END;
$$ LANGUAGE plpgsql STABLE;

-- Обновляем функцию check_probable_private_label со значением по умолчанию 4
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

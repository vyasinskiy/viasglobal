-- Перевод всех комментариев в функции get_asin_filter_reason на русский язык
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
    -- 1. Получаем самого актуального продавца в BuyBox из снапшотов (ProductFinder)
    SELECT "buyBoxSeller", "sellerId", "sellerPercentage"
    INTO v_buybox_seller, v_seller_id, v_seller_percentage
    FROM "ProductFinder"
    WHERE "asinId" = p_asin_id
    ORDER BY "createdAt" DESC
    LIMIT 1;

    -- Если данных о BuyBox для этого товара нет вообще
    IF v_buybox_seller IS NULL THEN
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    -- Если sellerId пустой, пытаемся вытащить данные (процент и ID) из текстового поля buyBoxSeller (для совместимости со старыми снапшотами)
    IF v_seller_id IS NULL THEN
        v_seller_percentage := substring(v_buybox_seller from '\((\d+)%\)')::INT;
        v_seller_id := trim(split_part(v_buybox_seller, ' / ', 2));
    END IF;

    -- 2. Проверяем, принадлежит ли этот ASIN Приватному Лейблу (Private Label)
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
    -- Ищем совпадение в таблице приватных лейблов по связке Бренд + Продавец
    LEFT JOIN "PrivateLabel" pl ON pl."brandId" = a."brandId" AND pl."sellerId" = v_seller_id
    WHERE a.id = p_asin_id;

    -- Если это приватный лейбл, сразу отсеиваем товар
    IF v_is_private_label THEN
        RETURN 'PRIVATE_LABEL';
    END IF;

    -- 3. ПРОВЕРКА НА ДОМИНИРУЮЩЕГО ПРОДАВЦА (DOMINANT SELLER)
    -- Проверяем, есть ли у нас вообще данные о процентах, больше ли они заданного порога (по умолчанию 80%) и знаем ли мы seller_id
    IF v_seller_percentage IS NOT NULL AND v_seller_percentage >= p_dominant_threshold AND v_seller_id <> '' THEN
        
        -- Считаем общее количество ASIN-ов у этой связки Бренд + Производитель в нашей базе
        SELECT count(*)
        INTO v_total_asins
        FROM "ASIN"
        WHERE "brandId" = v_brand_id AND "manufacturerId" = v_manufacturer_id;

        -- Если такие ASIN-ы вообще есть
        IF v_total_asins > 0 THEN
            -- Считаем количество ASIN-ов, где этот конкретный продавец (seller_id) сейчас сидит в BuyBox
            SELECT count(*)
            INTO v_seller_asins
            FROM "ASIN" a2
            JOIN LATERAL (
                -- Берем самый свежий снапшот (snapshot) для каждого ASIN-а
                SELECT "sellerId", "buyBoxSeller"
                FROM "ProductFinder" snap
                WHERE snap."asinId" = a2.id
                ORDER BY snap."createdAt" DESC
                LIMIT 1
            ) latest_snap ON true
            WHERE a2."brandId" = v_brand_id 
              AND a2."manufacturerId" = v_manufacturer_id
              -- Проверяем совпадение либо по sellerId, либо парсим из текста (для старых данных)
              AND (latest_snap."sellerId" = v_seller_id OR trim(split_part(latest_snap."buyBoxSeller", ' / ', 2)) = v_seller_id);

            -- Вычисляем долю (процент) ASIN-ов, которые принадлежат этому продавцу
            v_seller_share := (v_seller_asins::FLOAT / v_total_asins) * 100.0;

            -- Если доля продавца превышает пороговое значение (например, он контролирует 80% всех товаров бренда)
            -- Значит, бренд не пускает других продавцов, и мы маркируем это как DOMINANT_SELLER
            IF v_seller_share >= p_dominant_threshold THEN
                RETURN 'DOMINANT_SELLER';
            END IF;
        END IF;
    END IF;

    -- 4. Стандартная текстовая проверка на совпадение имен
    -- Если имя продавца содержит в себе имя бренда
    IF v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    -- Если имя продавца содержит в себе имя производителя
    IF v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
        RETURN 'BUYBOX_MATCH_MANUFACTURER';
    END IF;

    -- Если ни один фильтр не сработал, товар хороший, возвращаем NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

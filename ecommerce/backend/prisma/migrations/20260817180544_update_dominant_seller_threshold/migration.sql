-- Обновление функции get_asin_filter_reason: замена DOMINANT_SELLER на DOMINANT_BUY_BOX_SELLER и увеличение порога до 90%
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(p_asin_id INT, p_dominant_threshold INT DEFAULT 90)
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
    WHERE a.id = p_asin_id;

    -- Получаем самого актуального продавца в BuyBox из снапшотов (ProductFinder)
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

    -- 2. СТАНДАРТНЫЕ ТЕКСТОВЫЕ ПРОВЕРКИ (Выполняем до тяжелых JOIN-ов)
    -- Если имя продавца содержит в себе имя бренда
    IF v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    -- Если имя продавца содержит в себе имя производителя
    IF v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
        RETURN 'BUYBOX_MATCH_MANUFACTURER';
    END IF;

    -- 3. ПРОВЕРКА НА ПРИВАТНЫЙ ЛЕЙБЛ (Поиск в таблице PrivateLabel)
    -- Проверяем наличие связки Бренд + Продавец в таблице PrivateLabel
    SELECT CASE WHEN id IS NOT NULL THEN true ELSE false END
    INTO v_is_private_label
    FROM "PrivateLabel"
    WHERE "brandId" = v_brand_id AND "sellerId" = v_seller_id
    LIMIT 1;

    -- Если это приватный лейбл, сразу отсеиваем товар
    IF v_is_private_label THEN
        RETURN 'PRIVATE_LABEL';
    END IF;

    -- 4. ПРОВЕРКА НА ДОМИНИРУЮЩЕГО ПРОДАВЦА В ДАННОМ ASIN (DOMINANT BUY BOX SELLER)
    -- Если текущий продавец забирает >= 90% байбокса ИМЕННО В ЭТОМ ASIN-е, считаем его доминирующим
    IF v_seller_percentage IS NOT NULL AND v_seller_percentage >= p_dominant_threshold AND v_seller_id <> '' THEN
        RETURN 'DOMINANT_BUY_BOX_SELLER';
    END IF;

    -- Если ни один фильтр не сработал, товар хороший, возвращаем NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Также обновляем перегруженную функцию (для отладки по текстовому коду), чтобы дефолт тоже был 90
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(p_asin_code TEXT, p_dominant_threshold INT DEFAULT 90)
RETURNS TEXT AS $$
DECLARE
    v_asin_id INT;
BEGIN
    -- Находим ID ASIN-а по его строковому коду
    SELECT id INTO v_asin_id FROM "ASIN" WHERE code = p_asin_code LIMIT 1;
    
    IF v_asin_id IS NULL THEN
        RETURN 'ASIN_NOT_FOUND';
    END IF;
    
    -- Передаем вызов в основную функцию
    RETURN public.get_asin_filter_reason(v_asin_id, p_dominant_threshold);
END;
$$ LANGUAGE plpgsql STABLE;
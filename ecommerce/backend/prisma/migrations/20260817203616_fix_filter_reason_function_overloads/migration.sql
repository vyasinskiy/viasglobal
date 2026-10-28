-- Удаляем зависимое представление перед удалением старых перегрузок функций
DROP VIEW IF EXISTS public."FilteredAsinResultsView" CASCADE;

-- Удаляем все старые перегрузки функций с 1 и 2 параметрами, чтобы исключить неоднозначность вызова в PostgreSQL
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(INT, INT);
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(INT);
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_asin_filter_reason(TEXT);

-- Создаем основную функцию с 3 параметрами и значениями по умолчанию
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(
    p_asin_id INT, 
    p_dominant_threshold INT DEFAULT 90, 
    p_min_winner_count INT DEFAULT 3
)
RETURNS TEXT AS $$
DECLARE
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
    WHERE a.id = p_asin_id;

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
    WHERE "asinId" = p_asin_id
    ORDER BY "createdAt" DESC
    LIMIT 1;

    -- Если данных о BuyBox для этого товара нет вообще
    IF v_buybox_seller IS NULL THEN
        RETURN 'NO_BUYBOX_DATA';
    END IF;

    -- Если sellerId пустой, пытаемся вытащить ID из текстового поля buyBoxSeller
    IF v_seller_id IS NULL THEN
        v_seller_id := trim(split_part(v_buybox_seller, ' / ', 2));
    END IF;

    -- 2. СТАНДАРТНЫЕ ТЕКСТОВЫЕ ПРОВЕРКИ (Выполняем до тяжелых проверок)
    -- Если имя продавца содержит в себе имя бренда
    IF v_brand_name IS NOT NULL AND v_brand_name <> '' AND v_buybox_seller ILIKE '%' || v_brand_name || '%' THEN
        RETURN 'BUYBOX_MATCH_BRAND';
    END IF;

    -- Если имя продавца содержит в себе имя производителя
    IF v_manufacturer_name IS NOT NULL AND v_manufacturer_name <> '' AND v_buybox_seller ILIKE '%' || v_manufacturer_name || '%' THEN
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
            RETURN 'PRIVATE_LABEL';
        END IF;
    END IF;

    -- 4. ПРОВЕРКА НА КОЛИЧЕСТВО ПОБЕДИТЕЛЕЙ BUYBOX ЗА 90 ДНЕЙ (Критерий: от 3 продавцов)
    -- Если количество победителей BuyBox известно и строго меньше минимального порога (меньше 3)
    IF v_winner_count_90days IS NOT NULL AND v_winner_count_90days < p_min_winner_count THEN
        RETURN 'FEW_BUYBOX_WINNERS';
    END IF;

    -- 5. ПРОВЕРКА НА ДОМИНИРОВАНИЕ ТОПОВОГО ПРОДАВЦА ЗА 90 ДНЕЙ
    -- Если один топовый продавец удерживал BuyBox >= порога (по умолчанию 90%), листинг монополизирован
    IF v_top_seller_90days IS NOT NULL AND v_top_seller_90days >= p_dominant_threshold THEN
        RETURN 'DOMINANT_BUY_BOX_SELLER';
    END IF;

    -- Если ни один фильтр не сработал, товар подходит (чистый), возвращаем NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Перегруженная функция для поиска по строковому коду ASIN (например, 'B0CP218ZLS')
CREATE OR REPLACE FUNCTION public.get_asin_filter_reason(
    p_asin_code TEXT, 
    p_dominant_threshold INT DEFAULT 90, 
    p_min_winner_count INT DEFAULT 3
)
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
    RETURN public.get_asin_filter_reason(v_asin_id, p_dominant_threshold, p_min_winner_count);
END;
$$ LANGUAGE plpgsql STABLE;

-- Восстанавливаем представление FilteredAsinResultsView
CREATE OR REPLACE VIEW "FilteredAsinResultsView" AS
SELECT
  m.name AS "manufacturer",
  b.name AS "brand",
  s.name AS "sellerName",
  public.get_asin_filter_reason(a.id) AS "filterReason",
  COUNT(a.id)::INT AS "asinCount",
  string_agg(a.code, ', ') AS "asins",
  a."brandId" AS "brandId",
  s."sellerId" AS "sellerId"
FROM "ASIN" a
JOIN "Brand" b ON a."brandId" = b.id
JOIN "Manufacturer" m ON a."manufacturerId" = m.id
LEFT JOIN LATERAL (
    SELECT snap."sellerId", sel.name
    FROM "ProductFinder" snap
    LEFT JOIN "Seller" sel ON snap."sellerId" = sel.id
    WHERE snap."asinId" = a.id
    ORDER BY snap."createdAt" DESC
    LIMIT 1
) s ON true
GROUP BY 
  m.name, 
  b.name, 
  s.name, 
  public.get_asin_filter_reason(a.id), 
  a."brandId", 
  s."sellerId"
ORDER BY 
  public.get_asin_filter_reason(a.id) ASC NULLS FIRST, 
  COUNT(a.id) DESC;
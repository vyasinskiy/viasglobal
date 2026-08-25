-- ==============================================================================
-- Представление: WholesaleCandidatesView
-- Назначение: Сводный анализ и группировка товаров ASIN по Производителю, Бренду,
--             Продавцу и причине фильтрации (filterReason) для отбора потенциальных
--             кандидатов под оптовую торговлю (Wholesale). Включает список привязанных дистрибьюторов и EAN.
-- ==============================================================================

DROP VIEW IF EXISTS public."WholesaleCandidatesView";

CREATE OR REPLACE VIEW public."WholesaleCandidatesView" AS
SELECT
  -- Название производителя товара
  m.name AS "manufacturer",
  -- Название бренда товара
  b.name AS "brand",
  -- Имя продавца (из связанной таблицы Seller)
  s.name AS "sellerName",
  -- Причина фильтрации (NULL, если товар чистый и подходит для оптовой закупки)
  public.get_asin_filter_reason(a.id) AS "filterReason",
  -- Общее количество уникальных ASIN в данной группе
  COUNT(DISTINCT a.id)::INT AS "asinCount",
  -- Список кодов ASIN через запятую
  string_agg(DISTINCT a.code, ', ') AS "asins",
  -- Список уникальных EAN кодов через запятую
  string_agg(DISTINCT s."productCodesEAN", ', ') AS "eans",
  -- Список уникальных дистрибьюторов, привязанных к ASIN в данной группе
  string_agg(DISTINCT d.name, ', ') AS "distributors",
  -- Идентификатор бренда
  a."brandId" AS "brandId",
  -- Идентификатор продавца
  s."sellerId" AS "sellerId"
FROM "ASIN" a
JOIN "Brand" b ON a."brandId" = b.id
JOIN "Manufacturer" m ON a."manufacturerId" = m.id
LEFT JOIN LATERAL (
    SELECT snap."sellerId", sel.name, snap."productCodesEAN", snap."salesRankCurrent"
    FROM "ProductFinder" snap
    LEFT JOIN "Seller" sel ON snap."sellerId" = sel.id
    WHERE snap."asinId" = a.id
    ORDER BY snap."createdAt" DESC
    LIMIT 1
) s ON true
-- Присоединяем таблицу связи ASIN и дистрибьюторов
LEFT JOIN "_ASINToDistributor" ad ON ad."A" = a.id
-- Присоединяем дистрибьюторов для получения названий
LEFT JOIN "Distributor" d ON ad."B" = d.id
WHERE s."salesRankCurrent" >= 1 AND s."salesRankCurrent" <= 50000
GROUP BY 
  m.name, 
  b.name, 
  s.name, 
  public.get_asin_filter_reason(a.id), 
  a."brandId", 
  s."sellerId"
ORDER BY 
  public.get_asin_filter_reason(a.id) ASC NULLS FIRST, 
  COUNT(DISTINCT a.id) DESC;
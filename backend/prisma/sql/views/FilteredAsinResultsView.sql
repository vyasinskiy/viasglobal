-- ==============================================================================
-- Представление: FilteredAsinResultsView
-- Назначение: Сводный анализ и группировка ASIN по Производителю, Бренду, Продавцу
--             и результату фильтрации (filterReason).
-- ==============================================================================

CREATE OR REPLACE VIEW public."FilteredAsinResultsView" AS
SELECT
  -- Название производителя
  m.name AS "manufacturer",
  -- Название бренда
  b.name AS "brand",
  -- Имя продавца (из таблицы Seller)
  s.name AS "sellerName",
  -- Причина фильтрации (NULL если товар чистый / проходит критерии)
  public.get_asin_filter_reason(a.id) AS "filterReason",
  -- Общее количество ASIN в данной группе
  COUNT(a.id)::INT AS "asinCount",
  -- Список кодов ASIN через запятую
  string_agg(a.code, ', ') AS "asins",
  -- Идентификатор бренда
  a."brandId" AS "brandId",
  -- Идентификатор продавца
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

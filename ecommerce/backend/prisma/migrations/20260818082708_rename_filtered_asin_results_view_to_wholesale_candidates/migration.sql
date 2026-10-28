-- ==============================================================================
-- Миграция: rename_filtered_asin_results_view_to_wholesale_candidates
-- Назначение: Удаление устаревшего представления FilteredAsinResultsView и создание
--             нового представления WholesaleCandidatesView для сводного анализа кандидатов.
-- ==============================================================================

-- Удаляем старое представление, если оно существует
DROP VIEW IF EXISTS public."FilteredAsinResultsView";

-- Создаем новое представление WholesaleCandidatesView
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
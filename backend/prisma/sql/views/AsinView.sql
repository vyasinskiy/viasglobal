-- ==============================================================================
-- Представление: AsinView
-- Назначение: Удобная выборка товаров ASIN с базовыми полями и актуальным BuyBox.
-- ==============================================================================

CREATE OR REPLACE VIEW public."AsinView" AS
SELECT
  -- Идентификатор ASIN
  a.id AS "id",
  -- Код товара ASIN
  a.code AS "asin",
  -- Название бренда
  b.name AS "brand",
  -- Имя продавца (из связанной таблицы Seller)
  sel.name AS "seller",
  -- Текстовая строка BuyBox продавца из последнего снапшота Keepa (ProductFinder)
  latest."buyBoxSeller" AS "buyBoxSeller",
  -- Текущая цена BuyBox из последнего снапшота Keepa
  latest."buyBoxCurrent" AS "price"
FROM "ASIN" a
-- Присоединяем бренд для получения его названия
LEFT JOIN "Brand" b ON a."brandId" = b.id
-- Получаем самый свежий снапшот товара из ProductFinder
LEFT JOIN LATERAL (
  SELECT 
    pf."sellerId",
    pf."buyBoxSeller",
    pf."buyBoxCurrent"
  FROM "ProductFinder" pf
  WHERE pf."asinId" = a.id
  ORDER BY pf."createdAt" DESC
  LIMIT 1
) latest ON true
-- Присоединяем продавца по ID из снапшота
LEFT JOIN "Seller" sel ON latest."sellerId" = sel.id
ORDER BY a.id ASC;

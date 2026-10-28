-- ==============================================================================
-- Представление: AsinView
-- Назначение: Удобная выборка товаров ASIN с базовыми полями, штрихкодом EAN,
--             актуальной ценой Buy Box (buyBoxPrice) и расчетной максимальной ценой закупки (maxBuyPrice).
-- ==============================================================================

DROP VIEW IF EXISTS public."AsinView";

CREATE OR REPLACE VIEW public."AsinView" AS
SELECT
  -- Идентификатор ASIN
  a.id AS "id",
  -- Код товара ASIN
  a.code AS "asin",
  -- Штрихкод производителя EAN (из последнего снапшота Keepa)
  latest."productCodesEAN" AS "ean",
  -- Название бренда
  b.name AS "brand",
  -- Имя продавца (из связанной таблицы Seller)
  sel.name AS "seller",
  -- Текущая цена BuyBox из последнего снапшота Keepa
  latest."buyBoxCurrent" AS "buyBoxPrice",
  -- Расчетная максимальная цена оптовой закупки под 10% маржи
  public.calculate_max_buy_price(a.id) AS "maxBuyPrice"
FROM "ASIN" a
-- Присоединяем бренд для получения его названия
LEFT JOIN "Brand" b ON a."brandId" = b.id
-- Получаем самый свежий снапшот товара из ProductFinder
LEFT JOIN LATERAL (
  SELECT 
    pf."sellerId",
    pf."buyBoxCurrent",
    pf."productCodesEAN"
  FROM "ProductFinder" pf
  WHERE pf."asinId" = a.id
  ORDER BY pf."createdAt" DESC
  LIMIT 1
) latest ON true
-- Присоединяем продавца по ID из снапшота
LEFT JOIN "Seller" sel ON latest."sellerId" = sel.id
ORDER BY a.id ASC;

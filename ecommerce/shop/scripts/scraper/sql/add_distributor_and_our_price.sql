-- ==============================================================================
-- Миграция: Добавление колонок distributor_price и our_price
-- ==============================================================================
-- 1. Добавляет колонку distributor_price в products (оригинальная цена дистрибьютора)
-- 2. Добавляет колонку our_price в product_sources (наша цена продажи с маржой)
-- 3. Заполняет данные для ранее сохраненных товаров
-- ==============================================================================

BEGIN;

-- 1. Добавляем колонку distributor_price в мастер-товары
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS distributor_price numeric(10, 2);

COMMENT ON COLUMN public.products.distributor_price IS 'Оригинальная цена поставщика/дистрибьютора без наценки магазина (€)';

-- 2. Добавляем колонку our_price в таблицу источников предложений
ALTER TABLE public.product_sources 
ADD COLUMN IF NOT EXISTS our_price numeric(10, 2);

COMMENT ON COLUMN public.product_sources.our_price IS 'Наша расчетная розничная цена с учетом маржи магазина (€)';

-- 3. Заполняем distributor_price для существующих товаров из product_sources
UPDATE public.products p
SET distributor_price = COALESCE(
  (SELECT ps.retail_price 
   FROM public.product_sources ps 
   WHERE ps.product_id = p.id 
   ORDER BY ps.scraped_at DESC LIMIT 1),
  (SELECT ps.wholesale_price 
   FROM public.product_sources ps 
   WHERE ps.product_id = p.id 
   ORDER BY ps.scraped_at DESC LIMIT 1),
  p.price
)
WHERE p.distributor_price IS NULL;

-- 4. Заполняем our_price в product_sources на основе текущей цены товара
UPDATE public.product_sources ps
SET our_price = p.price
FROM public.products p
WHERE ps.product_id = p.id AND ps.our_price IS NULL;

COMMIT;

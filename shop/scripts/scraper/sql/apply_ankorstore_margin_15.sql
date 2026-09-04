-- ==============================================================================
-- Скрипт применения 15% маржи к товарам поставщика Ankorstore
-- ==============================================================================
-- Описание:
-- 1. Обновляет розничную цену на витрине (products.price), добавляя маржу 15% 
--    (умножение базовой цены поставщика на 1.15 с округлением до 2 знаков).
-- 2. Обновляет зачеркнутую акционную цену (products.original_price), если она была назначена.
-- 3. Сохраняет историю в поле updated_at.
-- ==============================================================================

-- Транзакция для безопасного применения изменений
BEGIN;

-- ШАГ 1: Обновление цен мастер-товаров Ankorstore
-- Если в product_sources зафиксирована retail_price / wholesale_price поставщика,
-- берем ее за эталон, иначе увеличиваем текущую цену на 15%.
UPDATE public.products p
SET 
  price = ROUND(
    COALESCE(
      (SELECT ps.retail_price 
       FROM public.product_sources ps 
       WHERE ps.product_id = p.id AND ps.source_name = 'ankorstore' 
       ORDER BY ps.scraped_at DESC LIMIT 1),
      (SELECT ps.wholesale_price 
       FROM public.product_sources ps 
       WHERE ps.product_id = p.id AND ps.source_name = 'ankorstore' 
       ORDER BY ps.scraped_at DESC LIMIT 1),
      p.price
    ) * 1.15, 
    2
  ),
  -- Пересчет зачеркнутой цены скидки при ее наличии (+15%)
  original_price = CASE 
    WHEN p.original_price IS NOT NULL 
    THEN ROUND(p.original_price * 1.15, 2)
    ELSE NULL
  END,
  updated_at = NOW()
WHERE 
  p.primary_source = 'ankorstore'
  OR EXISTS (
    SELECT 1 FROM public.product_sources ps 
    WHERE ps.product_id = p.id AND ps.source_name = 'ankorstore'
  );

-- Фиксация транзакции
COMMIT;

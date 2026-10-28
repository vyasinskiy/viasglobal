-- ==============================================================================
-- Миграция: Добавление колонок original_main_image и original_images
-- ==============================================================================
-- 1. Добавляет колонку original_main_image в products (ссылка на исходное фото)
-- 2. Добавляет колонку original_images в products (массив исходных фото галереи)
-- 3. Заполняет данные для существующих товаров текущими ссылками
-- ==============================================================================

BEGIN;

-- 1. Добавляем колонку original_main_image в мастер-товары
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_main_image text;

COMMENT ON COLUMN public.products.original_main_image IS 'Оригинальная ссылка на главное изображение товара до анти-поисковой обработки';

-- 2. Добавляем колонку original_images в мастер-товары
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_images jsonb;

COMMENT ON COLUMN public.products.original_images IS 'Оригинальный массив ссылок на изображения галереи до анти-поисковой обработки';

-- 3. Копируем текущие ссылки в original_main_image и original_images для всех товаров, где они еще не заполнены
UPDATE public.products
SET 
  original_main_image = COALESCE(original_main_image, main_image),
  original_images = COALESCE(original_images, images)
WHERE original_main_image IS NULL OR original_images IS NULL;

COMMIT;

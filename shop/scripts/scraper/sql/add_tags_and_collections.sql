-- ============================================================================
-- Миграция: Поддержка тегов товаров и сущности «Подборка / Коллекция» (collections)
-- ============================================================================

-- 1. Добавление колонки тегов к товарам
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_products_tags 
ON public.products USING GIN (tags);

-- 2. Создание таблицы коллекций / тематических подборок
CREATE TABLE IF NOT EXISTS public.collections (
  id text PRIMARY KEY, -- Уникальный слаг коллекции (например: 'summer25-beach')
  slug text UNIQUE NOT NULL, -- ЧПУ путь для витрины (/collections/[slug])
  title_es text NOT NULL, -- Название подборки на испанском (например: 'Colección Playa y Verano 2025')
  title_en text, -- Название на английском
  title_ru text, -- Название на русском (для служебного поиска)
  description_es text, -- Описание подборки
  primary_tag text NOT NULL, -- Основной тег для фильтрации товаров (например: 'playa')
  tags text[] DEFAULT '{}'::text[], -- Все связанные теги (['playa', 'verano', 'beach', 'summer'])
  source_url text, -- Исходная ссылка на подборку у поставщика
  source_name text, -- Источник ('ankorstore' и др.)
  banner_image text, -- Баннер / обложка коллекции
  total_products integer DEFAULT 0, -- Общее количество товаров в коллекции
  is_active boolean DEFAULT true, -- Показывать ли на витрине
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Индексы для быстрого поиска коллекций
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_primary_tag ON public.collections(primary_tag);
CREATE INDEX IF NOT EXISTS idx_collections_tags ON public.collections USING GIN (tags);

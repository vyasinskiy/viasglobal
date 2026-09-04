-- =====================================================================
-- Схема базы данных Supabase для каталога товаров и парсера поставщиков
-- Viasglobal Store (Multi-Source Scraper & Product Catalog)
-- =====================================================================

-- Включаем расширение для генерации UUID, если еще не включено
create extension if not exists "uuid-ossp";

-- 1. ТАБЛИЦА СЕССИЙ ПАРСИНГА (parsing_runs)
-- Фиксирует каждый запуск парсера с уникальным ID, источником и статистикой
create table if not exists public.parsing_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- Название источника (например: 'ankorstore', 'faire')
  source_url text not null, -- Стартовая ссылка парсинга (коллекция, категория, бренд)
  status text not null default 'running', -- 'running', 'completed', 'failed', 'paused_captcha'
  total_found integer default 0, -- Сколько ссылок на товары было обнаружено
  items_scraped integer default 0, -- Сколько товаров успешно обработано
  items_failed integer default 0, -- Сколько товаров завершились ошибкой
  started_at timestamptz not null default timezone('utc'::text, now()),
  finished_at timestamptz,
  error_message text, -- Текст критической ошибки, если запуск упал
  log_file_path text, -- Путь к локальному файлу подробного лога
  metadata jsonb default '{}'::jsonb, -- Дополнительные параметры запуска (лимиты, фильтры)
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- Индексы для таблицы сессий
create index if not exists idx_parsing_runs_source on public.parsing_runs(source);
create index if not exists idx_parsing_runs_status on public.parsing_runs(status);
create index if not exists idx_parsing_runs_started_at on public.parsing_runs(started_at desc);

-- 2. ТАБЛИЦА МАСТЕР-ТОВАРОВ ВИТРИНЫ (products)
-- Единый мастер-каталог магазина. Дедупликация производится строго по штрихкоду EAN
create table if not exists public.products (
  id text primary key, -- Уникальный идентификатор товара (например: 'prod-3665841016121' или slug)
  ean text unique, -- Европейский штрихкод EAN-13 / GTIN (ключ уникальности от разных поставщиков)
  slug text unique not null, -- ЧПУ для ссылки на витрине (/products/[slug])
  title_es text not null, -- Название товара на испанском языке
  title_en text, -- Название товара на английском языке
  description_es text, -- Полное описание на испанском языке
  description_en text, -- Полное описание на английском языке
  short_description_es text, -- Краткое описание для карточки на испанском
  short_description_en text, -- Краткое описание для карточки на английском
  price numeric(10, 2) not null, -- Текущая розничная цена на витрине в евро (€) (Наша цена с маржой)
  distributor_price numeric(10, 2), -- Оригинальная цена поставщика / дистрибьютора без наценки магазина (€)
  original_price numeric(10, 2), -- Зачеркнутая цена для скидок (€)
  currency text not null default 'EUR', -- Валюта
  category text not null default 'lifestyle', -- Категория каталога ('electronics', 'workspace', etc.)
  brand text not null, -- Бренд / производитель
  sku text, -- Артикул товара
  main_image text not null, -- Главное изображение товара (URL)
  images jsonb not null default '[]'::jsonb, -- Массив дополнительных фото (JSONB array of strings)
  specs jsonb not null default '{"es": {}, "en": {}}'::jsonb, -- Технические характеристики
  features jsonb not null default '{"es": [], "en": []}'::jsonb, -- Список ключевых преимуществ (буллеты)
  rating numeric(3, 2) not null default 4.8, -- Рейтинг товара (от 1.0 до 5.0)
  review_count integer not null default 12, -- Количество отзывов
  in_stock boolean not null default true, -- Наличие на складе
  stock_count integer not null default 20, -- Остаток на складе
  is_bestseller boolean not null default false, -- Метка «Хит продаж»
  is_featured boolean not null default false, -- Метка «Рекомендуемый товар»
  is_new boolean not null default false, -- Метка «Новинка»
  tags text[] default '{}'::text[], -- Коллекционные теги (например: ['playa', 'verano', 'colegio'])
  primary_source text, -- Первичный источник, откуда товар был добавлен
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Индексы для быстрого поиска мастер-товаров
create index if not exists idx_products_ean on public.products(ean);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_tags on public.products using gin(tags);

-- 3. ТАБЛИЦА ИСТОЧНИКОВ И СНАПШОТОВ ПОСТАВЩИКОВ (product_sources)
-- Связывает мастер-товар со всеми поставщиками, у которых он найден, и хранит сырой снимок данных
create table if not exists public.product_sources (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade, -- Связь с мастер-товаром
  parsing_run_id uuid references public.parsing_runs(id) on delete set null, -- Связь с сессией парсинга
  source_name text not null, -- Название поставщика (например: 'ankorstore')
  source_url text not null, -- Прямая ссылка на карточку товара у поставщика
  supplier_sku text, -- Артикул товара в системе поставщика
  supplier_brand text, -- Название бренда у поставщика
  wholesale_price numeric(10, 2), -- Оптовая B2B цена у поставщика в евро (€), если доступна
  retail_price numeric(10, 2), -- Рекомендованная розничная цена (PVP) у поставщика в евро (€) (Оригинальная цена дистрибьютора)
  our_price numeric(10, 2), -- Наша расчетная розничная цена с учетом маржи магазина (€)
  currency text not null default 'EUR', -- Валюта поставщика
  in_stock boolean not null default true, -- Доступность у поставщика на момент парсинга
  raw_data jsonb not null default '{}'::jsonb, -- Полный неизмененный снимок спарсенных данных (Schema.org JSON-LD и др.)
  scraped_at timestamptz not null default timezone('utc'::text, now()) -- Время снятия снапшота
);

-- Индексы для таблицы источников
create index if not exists idx_product_sources_product_id on public.product_sources(product_id);
create index if not exists idx_product_sources_parsing_run_id on public.product_sources(parsing_run_id);
create index if not exists idx_product_sources_source_name on public.product_sources(source_name);
create index if not exists idx_product_sources_source_url on public.product_sources(source_url);

-- 4. ТАБЛИЦА ДЕТАЛИЗИРОВАННЫХ ПОШАГОВЫХ ЛОГОВ (parsing_logs)
-- Логирование каждого шага парсинга конкретного товара в базе данных
create table if not exists public.parsing_logs (
  id uuid primary key default gen_random_uuid(),
  parsing_run_id uuid not null references public.parsing_runs(id) on delete cascade,
  level text not null default 'INFO', -- 'INFO', 'WARN', 'ERROR', 'DEBUG'
  step text not null, -- 'INIT', 'CAPTCHA_CHECK', 'COLLECT_URLS', 'FETCH_ITEM', 'EXTRACT', 'DEDUPLICATION', 'SAVE_DB'
  item_url text, -- Ссылка на обрабатываемый товар (если применимо)
  message text not null, -- Текст сообщения
  details jsonb default '{}'::jsonb, -- Дополнительный контекст или стектрейс ошибки
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_parsing_logs_run_id on public.parsing_logs(parsing_run_id);
create index if not exists idx_parsing_logs_level on public.parsing_logs(level);

-- 5. ТРИГГЕР АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at ДЛЯ ТАБЛИЦЫ PRODUCTS
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_products_updated_at on public.products;
create trigger trigger_products_updated_at
  before update on public.products
  for each row
  execute function public.handle_updated_at();

-- 6. НАСТРОЙКА БЕЗОПАСНОСТИ ROW LEVEL SECURITY (RLS)
alter table public.parsing_runs enable row level security;
alter table public.products enable row level security;
alter table public.product_sources enable row level security;
alter table public.parsing_logs enable row level security;

-- Публичный доступ на чтение товаров витрины
create policy "Allow public read on products"
  on public.products for select
  using (true);

-- Публичный доступ на чтение предложений поставщиков (опционально)
create policy "Allow public read on product_sources"
  on public.product_sources for select
  using (true);

-- Полный доступ для служебных скриптов через service_role key
create policy "Allow service_role all on parsing_runs"
  on public.parsing_runs for all
  using (auth.role() = 'service_role' or current_user = 'postgres');

create policy "Allow service_role all on products"
  on public.products for all
  using (auth.role() = 'service_role' or current_user = 'postgres');

create policy "Allow service_role all on product_sources"
  on public.product_sources for all
  using (auth.role() = 'service_role' or current_user = 'postgres');

create policy "Allow service_role all on parsing_logs"
  on public.parsing_logs for all
  using (auth.role() = 'service_role' or current_user = 'postgres');

-- 7. ТАБЛИЦА ТЕМАТИЧЕСКИХ ПОДБОРОК И КОЛЛЕКЦИЙ (collections)
create table if not exists public.collections (
  id text primary key,
  slug text unique not null,
  title_es text not null,
  title_en text,
  title_ru text,
  description_es text,
  primary_tag text not null,
  tags text[] default '{}'::text[],
  source_url text,
  source_name text,
  banner_image text,
  total_products integer default 0,
  is_active boolean default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_collections_slug on public.collections(slug);
create index if not exists idx_collections_primary_tag on public.collections(primary_tag);
create index if not exists idx_collections_tags on public.collections using gin(tags);

alter table public.collections enable row level security;
create policy "Allow public read on collections" on public.collections for select using (true);
create policy "Allow service_role all on collections" on public.collections for all using (auth.role() = 'service_role' or current_user = 'postgres');

-- ============================================================================
-- Настройка публичного бакета 'products' в Supabase Storage и CDN-политик
-- ============================================================================

-- 1. Регистрация публичного бакета для изображений товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760, -- макс. 10 МБ на файл
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- 2. Разрешение публичного чтения для всех клиентов и CDN (SELECT)
DROP POLICY IF EXISTS "Public Read Products" ON storage.objects;
CREATE POLICY "Public Read Products"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- 3. Разрешение на загрузку файлов (INSERT)
DROP POLICY IF EXISTS "Allow All Insert Products" ON storage.objects;
CREATE POLICY "Allow All Insert Products"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'products' );

-- 4. Разрешение на обновление существующих файлов (UPDATE)
DROP POLICY IF EXISTS "Allow All Update Products" ON storage.objects;
CREATE POLICY "Allow All Update Products"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'products' );

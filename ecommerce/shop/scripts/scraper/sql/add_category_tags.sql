-- Скрипт добавления категориальных тегов и актуализации категорий товаров в PostgreSQL
-- Добавляет теги: hogar-decoracion, papeleria-creatividad, ninos-juegos, moda-accesorios, tecnologia-gadgets
-- Сохраняет все существующие теги подборок (playa, colegio, halloween и др.)

-- 1. Добавление тегов канцелярии и офиса (Papelería & Oficina)
UPDATE products
SET 
  tags = (SELECT ARRAY(SELECT DISTINCT elem FROM unnest(COALESCE(tags, '{}'::text[]) || ARRAY['papeleria-creatividad', 'papeleria']) elem)),
  category = 'workspace'
WHERE (title_es ~* 'cuaderno|libreta|agenda|bolígrafo|boligrafo|rotulador|tijeras|sacapuntas|estuche|papelería|papeleria|lapiz|lápiz|clip|portalápices|oficina|organizador de escritorio|bloc|marcapáginas|notas adhesivas|marcador|pluma')
   OR (description_es ~* 'cuaderno|libreta|agenda|bolígrafo|boligrafo|rotulador|tijeras|sacapuntas|estuche|papelería|papeleria|portalápices|organizador de escritorio');

-- 2. Добавление тегов детей и игрушек (Niños & Juguetes)
UPDATE products
SET 
  tags = (SELECT ARRAY(SELECT DISTINCT elem FROM unnest(COALESCE(tags, '{}'::text[]) || ARRAY['ninos-juegos', 'juguetes', 'infantil']) elem)),
  category = CASE WHEN category = 'workspace' AND title_es !~* 'cuaderno|agenda|bolígrafo|tijeras|estuche' THEN 'lifestyle' ELSE category END
WHERE (title_es ~* 'niño|niña|infantil|juguete|juego|dinosaurio|peluche|bebé|bebe|guardería|guarderia|educativo|marioneta|puzzle|creativo|manualidades|bádminton|kidult|plastilina|puzzles|dragon ball|muñeca|construcción')
   OR (description_es ~* 'juguete|juego infantil|para niños|para niñas|bebé|guardería|peluche|manualidades infantiles');

-- 3. Добавление тегов дома, кухни и декора (Hogar, Cocina & Decoración)
UPDATE products
SET 
  tags = (SELECT ARRAY(SELECT DISTINCT elem FROM unnest(COALESCE(tags, '{}'::text[]) || ARRAY['hogar-decoracion', 'hogar', 'decoracion']) elem)),
  category = CASE WHEN category = 'workspace' AND title_es !~* 'cuaderno|agenda|bolígrafo|tijeras|estuche|papelería' THEN 'lifestyle' ELSE category END
WHERE (title_es ~* 'taza|vaso|plato|porcelana|cerámica|ceramica|vela|manta|cojín|cojin|fouta|toalla|decoración|decoracion|botella|lonchera|bocadillos|cocina|hogar|mesa|jarrón|jarron|cuadro|espejo|tapiz|aroma|difusor|florero|incienso|vajilla|maceta')
   OR (description_es ~* 'decoración del hogar|para el hogar|vajilla|cocina|cerámica artesanal|vela perfumada|difusor de aroma');

-- 4. Добавление тегов моды, красоты и аксессуаров (Moda, Belleza & Accesorios)
UPDATE products
SET 
  tags = (SELECT ARRAY(SELECT DISTINCT elem FROM unnest(COALESCE(tags, '{}'::text[]) || ARRAY['moda-accesorios', 'accesorios']) elem)),
  category = CASE WHEN category = 'workspace' AND title_es !~* 'cuaderno|agenda|bolígrafo|tijeras|estuche' THEN 'lifestyle' ELSE category END
WHERE (title_es ~* 'bolso|tote|neceser|pañuelo|joya|pin |pines|alfiler|calcetín|calcetines|jabón|jabon|perfume|belleza|bikini|bañador|baño|mochila|llavero|cosmética|cosmetica|joyería|joyeria|pendientes|pulsera|anillo')
   OR (description_es ~* 'bolso tote|jabón artesanal|fragancia de grasse|manteca de karité|neceser');

-- 5. Добавление тегов технологий и гаджетов (Tecnología & Gadgets)
UPDATE products
SET 
  tags = (SELECT ARRAY(SELECT DISTINCT elem FROM unnest(COALESCE(tags, '{}'::text[]) || ARRAY['tecnologia-gadgets', 'gadgets']) elem)),
  category = 'electronics'
WHERE (title_es ~* 'cargador|cable|led|lámpara|lampara|usb|batería|bateria|tecnología|tecnologia|gadget|bluetooth|altavoz|auricular|reloj|smart|electrónica|electronica|inalámbrico|inalambrico')
   OR (description_es ~* 'carga rápida|cable usb|batería externa|lámpara led|conexión bluetooth');

-- 6. Для любых оставшихся товаров без категориального тега проставляем hogar-decoracion
UPDATE products
SET 
  tags = (SELECT ARRAY(SELECT DISTINCT elem FROM unnest(COALESCE(tags, '{}'::text[]) || ARRAY['hogar-decoracion', 'hogar']) elem)),
  category = CASE WHEN category = 'workspace' THEN 'lifestyle' ELSE category END
WHERE NOT (tags && ARRAY['papeleria-creatividad', 'ninos-juegos', 'hogar-decoracion', 'moda-accesorios', 'tecnologia-gadgets']);

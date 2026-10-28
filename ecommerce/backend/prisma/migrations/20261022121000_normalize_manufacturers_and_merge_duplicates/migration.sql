-- ==============================================================================
-- Миграция: 20261022121000_normalize_manufacturers_and_merge_duplicates
-- Описание: 
--   1. Очистка и нормализация названий производителей в таблице "Manufacturer":
--      - Удаление технических вендор-кодов Amazon Vendor Central в скобках (COFB0, MAMQ3, CES7F, EMOS5, PUTJ7, VEUI5, DUNMR, 3PL).
--      - Унификация организационно-правовых форм компаний на конце названия к единому эталону:
--        S.L. / SL -> ", S.L."
--        S.L.U. / SLU -> ", S.L.U."
--        S.A. / SA -> ", S.A."
--        S.A.U. / SAU -> ", S.A.U."
--        S.R.L. / SRL -> ", S.R.L."
--        B.V. / BV -> " B.V."
--        GMBH -> " GMBH"
--   2. Слияние образовавшихся дубликатов производителей:
--      - Перепривязка связей в таблице "ASIN" ("manufacturerId") на основной ID производителя.
--      - Удаление избыточных записей-дубликатов из таблицы "Manufacturer".
--   3. Синхронизация поля manufacturer в таблице "ProductFinder" для консистентности.
-- ==============================================================================

-- 1. Создаем временную таблицу с нормализованными именами
CREATE TEMP TABLE tmp_m_norm AS
SELECT 
    m.id,
    m.name AS original_name,
    m."isAnalyzed",
    (SELECT COUNT(*) FROM "ASIN" a WHERE a."manufacturerId" = m.id) AS asin_count,
    TRIM(REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(
                  TRIM(REGEXP_REPLACE(UPPER(m.name), '\s*\(([A-Z0-9]*[0-9][A-Z0-9]*|DUNMR|3PL)\)$', '', 'i')),
                  '[,.]?\s*\y(S\.?L\.?U\.?|SLU)\y\.?$', ', S.L.U.', 'i'
                ),
                '[,.]?\s*\y(S\.?L\.?|SL)\y\.?$', ', S.L.', 'i'
              ),
              '[,.]?\s*\y(S\.?A\.?U\.?|SAU)\y\.?$', ', S.A.U.', 'i'
            ),
            '[,.]?\s*\y(S\.?A\.?|SA)\y\.?$', ', S.A.', 'i'
          ),
          '[,.]?\s*\y(S\.?R\.?L\.?|SRL)\y\.?$', ', S.R.L.', 'i'
        ),
        '[,.]?\s*\y(B\.?V\.?|BV)\y\.?$', ' B.V.', 'i'
      ),
      '[,.]?\s*\y(GMBH)\y\.?$', ' GMBH', 'i'
    )) AS normalized_name
FROM "Manufacturer" m;

-- 2. Группируем и определяем основной ID (primary_id) для каждой группы дубликатов
-- Приоритет: 1) isAnalyzed = true, 2) наибольшее число привязанных товаров ASIN, 3) наименьший id
CREATE TEMP TABLE tmp_m_groups AS
SELECT 
    t.normalized_name,
    t.id,
    t.original_name,
    t.asin_count,
    t."isAnalyzed",
    FIRST_VALUE(t.id) OVER (
        PARTITION BY t.normalized_name 
        ORDER BY t."isAnalyzed" DESC, t.asin_count DESC, t.id ASC
    ) AS primary_id
FROM tmp_m_norm t;

-- 3. Перепривязываем ASIN с дубликатов на основной ID (primary_id)
UPDATE "ASIN" a
SET "manufacturerId" = g.primary_id
FROM tmp_m_groups g
WHERE a."manufacturerId" = g.id
  AND g.id != g.primary_id;

-- 4. Удаляем записи-дубликаты из таблицы Manufacturer
DELETE FROM "Manufacturer" m
USING tmp_m_groups g
WHERE m.id = g.id
  AND g.id != g.primary_id;

-- 5. Обновляем имена оставшихся основных записей на нормализованный вид
UPDATE "Manufacturer" m
SET "name" = g.normalized_name
FROM (SELECT DISTINCT primary_id, normalized_name FROM tmp_m_groups) g
WHERE m.id = g.primary_id
  AND m."name" != g.normalized_name;

-- 6. Синхронизируем текстовое поле manufacturer в ProductFinder со связанным ASIN
UPDATE "ProductFinder" snap
SET "manufacturer" = m.name
FROM "ASIN" a
JOIN "Manufacturer" m ON a."manufacturerId" = m.id
WHERE snap."asinId" = a.id
  AND snap."manufacturer" IS NOT NULL
  AND snap."manufacturer" != m.name;

-- Очищаем временные таблицы
DROP TABLE IF EXISTS tmp_m_groups;
DROP TABLE IF EXISTS tmp_m_norm;

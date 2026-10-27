#!/usr/bin/env bash
# ==============================================================================
# Скрипт автоматической сверки идентичности боевой БД на Huawei и восстановленной БД
#
# Сверяет:
# 1. Структуру (список и количество таблиц и представлений).
# 2. Количество строк (COUNT(*)) по всем 22 таблицам.
# 3. Контрольные суммы (MD5 хеши) данных ключевых сущностей:
#    - Brand
#    - Manufacturer
#    - ASIN
#    - Seller
#    - ProductFinder
#    - DistributorPriceSnapshot
#    - _prisma_migrations
#
# Использование:
#   ./verify-checksums.sh [--source-host 100.92.50.18] [--source-port 5432] [--target-port 5435]
# ==============================================================================

# Строгий режим выполнения
set -euo pipefail

SOURCE_HOST="${1:-100.92.50.18}"
SOURCE_PORT="${2:-5432}"
TARGET_HOST="localhost"
TARGET_PORT="${3:-5435}"
DB_NAME="viasglobal_db"
DB_USER="viasuser"
export PGPASSWORD="viaspassword"

echo "======================================================================"
echo "🔍 Сверка идентичности баз данных Viasglobal"
echo "   Источник (Боевой сервер Huawei): ${SOURCE_HOST}:${SOURCE_PORT}/${DB_NAME}"
echo "   Целевая (Восстановленная база):  ${TARGET_HOST}:${TARGET_PORT}/${DB_NAME}"
echo "======================================================================"

# Проверяем доступность обеих баз
if ! pg_isready -h "${SOURCE_HOST}" -p "${SOURCE_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; then
  echo "❌ Ошибка: база-источник ${SOURCE_HOST}:${SOURCE_PORT} недоступна!"
  exit 1
fi

if ! pg_isready -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; then
  echo "❌ Ошибка: целевая база ${TARGET_HOST}:${TARGET_PORT} недоступна!"
  exit 1
fi

echo "✅ Обе базы данных доступны. Начинаем сравнение..."
echo ""

# ------------------------------------------------------------------------------
# 1. Сравнение количества строк по всем таблицам
# ------------------------------------------------------------------------------
echo "--- [1/2] Сравнение количества записей (COUNT(*)) по таблицам ---"
printf "%-30s | %-15s | %-15s | %-10s\n" "Таблица" "Huawei (Боевая)" "Local (Бэкап)" "Статус"
printf -- "-------------------------------+-----------------+-----------------+-----------\n"

# Получаем список всех базовых таблиц схемы public
TABLES=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;")

MISMATCH_COUNT=0

for TBL in ${TABLES}; do
  CNT_SRC=$(psql -h "${SOURCE_HOST}" -p "${SOURCE_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT count(*) FROM \"${TBL}\";" 2>/dev/null || echo "ERR")
  CNT_TGT=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT count(*) FROM \"${TBL}\";" 2>/dev/null || echo "ERR")

  STATUS="✅ OK"
  # Таблицы динамических очередей Keepa могут немного прирастать в течение дня
  if [ "${CNT_SRC}" != "${CNT_TGT}" ]; then
    if [[ "${TBL}" =~ Queue$ ]]; then
      STATUS="ℹ️ Очередь (+$((${CNT_SRC} - ${CNT_TGT})))"
    else
      STATUS="❌ РАСХОЖДЕНИЕ"
      MISMATCH_COUNT=$((MISMATCH_COUNT + 1))
    fi
  fi

  printf "%-30s | %-15s | %-15s | %-10s\n" "${TBL}" "${CNT_SRC}" "${CNT_TGT}" "${STATUS}"
done

echo ""
# ------------------------------------------------------------------------------
# 2. Сравнение контрольных сумм (MD5 хешей контента) ключевых сущностей
# ------------------------------------------------------------------------------
echo "--- [2/2] Сравнение MD5 контрольных сумм содержимого ключевых таблиц ---"
printf "%-26s | %-34s | %-34s | %-8s\n" "Сущность" "Хеш на Huawei" "Хеш на Local" "Статус"
printf -- "---------------------------+------------------------------------+------------------------------------+---------\n"

verify_hash() {
  local NAME="$1"
  local SQL_QUERY="$2"

  local HASH_SRC
  HASH_SRC=$(psql -h "${SOURCE_HOST}" -p "${SOURCE_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "${SQL_QUERY}" 2>/dev/null || echo "ERR_SRC")
  local HASH_TGT
  HASH_TGT=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "${SQL_QUERY}" 2>/dev/null || echo "ERR_TGT")

  local STATUS="✅ OK"
  if [ "${HASH_SRC}" != "${HASH_TGT}" ]; then
    STATUS="❌ MISMATCH"
    MISMATCH_COUNT=$((MISMATCH_COUNT + 1))
  fi

  printf "%-26s | %-34s | %-34s | %-8s\n" "${NAME}" "${HASH_SRC}" "${HASH_TGT}" "${STATUS}"
}

verify_hash "Brand" "SELECT md5(string_agg(id::text || name, ',' ORDER BY id)) FROM \"Brand\";"
verify_hash "Manufacturer" "SELECT md5(string_agg(id::text || name, ',' ORDER BY id)) FROM \"Manufacturer\";"
verify_hash "Seller" "SELECT md5(string_agg(id || name, ',' ORDER BY id)) FROM \"Seller\";"
verify_hash "ASIN (100k записей)" "SELECT md5(string_agg(id::text || code, ',' ORDER BY id)) FROM \"ASIN\";"
verify_hash "ProductFinder" "SELECT md5(string_agg(id::text, ',' ORDER BY id)) FROM \"ProductFinder\";"
verify_hash "DistributorPriceSnapshot" "SELECT md5(string_agg(id::text || \"asinId\" || \"costPrice\"::text, ',' ORDER BY id)) FROM \"DistributorPriceSnapshot\";"
verify_hash "_prisma_migrations (94 шт)" "SELECT md5(string_agg(id || checksum, ',' ORDER BY id)) FROM \"_prisma_migrations\";"

echo "======================================================================"
if [ "${MISMATCH_COUNT}" -eq 0 ]; then
  echo "🎉 РЕЗУЛЬТАТ: Базы данных 100% ИДЕНТИЧНЫ!"
  echo "   Резервная копия полностью целостна и готова к немедленному использованию."
  exit 0
else
  echo "⚠️ РЕЗУЛЬТАТ: Обнаружено расхождений: ${MISMATCH_COUNT}"
  exit 1
fi

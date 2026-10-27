#!/usr/bin/env bash
# ==============================================================================
# Универсальный скрипт восстановления баз данных Viasglobal из резервных копий
#
# Поддерживает:
# - Восстановление на боевом сервере Huawei или локально на Mac.
# - Выбор конкретной базы (viasglobal_db, rent, ecommerce) или всех сразу.
# - Автоматический выбор самого свежего бэкапа или указание конкретного файла.
#
# Использование:
#   ./restore.sh --db viasglobal [--file /path/to/backup.sql.gz] [--container backend-db-1]
#   ./restore.sh --db rent [--file /path/to/backup.sql.gz] [--container accruals-postgres]
#   ./restore.sh --db ecommerce [--file /path/to/backup.sql.gz] [--container ecommerce-db]
# ==============================================================================

# Строгий режим выполнения
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_BASE_DIR="${PROJECT_ROOT}/backend/backups"

# Значения аргументов по умолчанию
TARGET_DB=""
BACKUP_FILE=""
CONTAINER_NAME=""
DB_USER=""
DB_NAME=""

# Разбор аргументов командной строки
while [[ $# -gt 0 ]]; do
  case "$1" in
    --db)
      TARGET_DB="$2"
      shift 2
      ;;
    --file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --container)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --user)
      DB_USER="$2"
      shift 2
      ;;
    --help|-h)
      echo "Использование: $0 --db <viasglobal|rent|ecommerce> [--file <путь>] [--container <имя>]"
      exit 0
      ;;
    *)
      echo "Неизвестный параметр: $1"
      exit 1
      ;;
  esac
done

if [ -z "${TARGET_DB}" ]; then
  echo "❌ Ошибка: укажите базу данных через флаг --db (viasglobal, rent или ecommerce)"
  exit 1
fi

echo "======================================================================"
echo "🔄 [$(date '+%Y-%m-%d %H:%M:%S')] Запуск восстановления БД: ${TARGET_DB}..."
echo "======================================================================"

case "${TARGET_DB}" in
  viasglobal)
    CONTAINER_NAME="${CONTAINER_NAME:-backend-db-1}"
    DB_USER="${DB_USER:-viasuser}"
    DB_NAME="${DB_NAME:-viasglobal_db}"
    # Если файл не указан явно, берем самый свежий бэкап
    if [ -z "${BACKUP_FILE}" ]; then
      BACKUP_FILE="$(find "${BACKUP_BASE_DIR}" -type f -name "*viasglobal*.sql.gz" -o -name "backup_*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    fi
    ;;
  rent)
    CONTAINER_NAME="${CONTAINER_NAME:-accruals-postgres}"
    DB_USER="${DB_USER:-postgres}"
    DB_NAME="${DB_NAME:-postgres}"
    if [ -z "${BACKUP_FILE}" ]; then
      BACKUP_FILE="$(find "${BACKUP_BASE_DIR}/rent" "${PROJECT_ROOT}/rent/infra/backups" -type f -name "*rent*.sql.gz" -o -name "db_backup_*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    fi
    ;;
  ecommerce)
    CONTAINER_NAME="${CONTAINER_NAME:-ecommerce-db}"
    DB_USER="${DB_USER:-viasuser}"
    DB_NAME="${DB_NAME:-ecommerce_db}"
    if [ -z "${BACKUP_FILE}" ]; then
      BACKUP_FILE="$(find "${BACKUP_BASE_DIR}/ecommerce" -type f -name "*ecommerce*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    fi
    ;;
  *)
    echo "❌ Неверное имя базы: ${TARGET_DB}. Допустимые: viasglobal, rent, ecommerce"
    exit 1
    ;;
esac

# Проверяем наличие файла дампа
if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Файл бэкапа не найден: ${BACKUP_FILE}"
  exit 1
fi

echo "📁 Используемый файл дампа: ${BACKUP_FILE}"
echo "🐳 Целевой Docker-контейнер: ${CONTAINER_NAME}"
echo "👤 Пользователь БД: ${DB_USER}, База: ${DB_NAME}"

# 1. Проверяем целостность архива перед заливкой
echo "🔍 Проверка целостности архива gzip..."
if ! gzip -t "${BACKUP_FILE}"; then
  echo "❌ Файл ${BACKUP_FILE} ПОВРЕЖДЕН! Восстановление отменено во избежание потери данных."
  exit 1
fi
echo "✅ Целостность архива подтверждена."

# 2. Проверяем доступность контейнера
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Контейнер ${CONTAINER_NAME} не запущен в Docker!"
  exit 1
fi

# 3. Ожидаем готовности СУБД к приему команд
echo "⏳ Проверка готовности PostgreSQL в контейнере..."
until docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" > /dev/null 2>&1; do
  echo "Ожидание готовности PostgreSQL..."
  sleep 1
done

# Если СУБД запущена в режиме реплики (standby), переводим её в режим master (read-write)
if docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT pg_is_in_recovery();" 2>/dev/null | grep -q 't'; then
  echo "⚡ База данных в режиме standby (recovery). Выполняем pg_promote() в режим master..."
  docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT pg_promote();" >/dev/null 2>&1 || true
  sleep 2
fi

# 4. Выполняем восстановление
echo "🚀 Подготовка базы и импорт дампа..."
START_RESTORE="$(date +%s)"

# Закрываем активные подключения к восстанавливаемой базе данных
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true

# Для баз с отдельной схемой (viasglobal и ecommerce) пересоздаем чистую схему public во избежание конфликтов ключей
if [[ "${TARGET_DB}" == "viasglobal" ]] || [[ "${TARGET_DB}" == "ecommerce" ]]; then
  echo "🧹 Очистка старых таблиц перед импортом (DROP SCHEMA public CASCADE)..."
  docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO \"${DB_USER}\";" >/dev/null 2>&1 || true
fi

# Если дамп создан через pg_dumpall, заливаем в postgres, иначе в конкретную БД
if [[ "${TARGET_DB}" == "rent" ]]; then
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -q -o /dev/null
else
  gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -q -o /dev/null
fi

END_RESTORE="$(date +%s)"
DURATION=$((END_RESTORE - START_RESTORE))

echo "======================================================================"
echo "✅ Восстановление успешно завершено за ${DURATION} сек!"
echo "📊 Проверка таблиц в восстановленной базе:"
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "\dt"
echo "======================================================================"

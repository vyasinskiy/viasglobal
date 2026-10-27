#!/usr/bin/env bash
# ==============================================================================
# Скрипт ежедневного резервного копирования всех баз данных Viasglobal на Huawei
#
# Резервируемые базы данных:
# 1. viasglobal_db (PostgreSQL 15, контейнер backend-db-1) - каталог wholesale/Keepa
# 2. rent (PostgreSQL 16, контейнер accruals-postgres) - учет аренды, ЖКХ, бот
# 3. ecommerce_db (PostgreSQL 16, контейнер ecommerce-db) - CRM/ERP заказы и товары
# ==============================================================================

# Строгий режим выполнения: прерывание при ошибках, не объявленных переменных и ошибках в пайпах
set -euo pipefail

# Определяем базовую директорию проекта (корень репозитория viasglobal)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Корневой каталог для хранения локальных архивов бэкапов
BACKUP_BASE_DIR="${PROJECT_ROOT}/backend/backups"
mkdir -p "${BACKUP_BASE_DIR}/viasglobal"
mkdir -p "${BACKUP_BASE_DIR}/rent"
mkdir -p "${BACKUP_BASE_DIR}/ecommerce"

# Загружаем переменные окружения для S3 / R2 и Telegram (если файлы существуют)
if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
  # Читаем переменные окружения из backend/.env
  set -a
  source "${PROJECT_ROOT}/backend/.env"
  set +a
fi

if [ -f "${PROJECT_ROOT}/sms-gateway/.env" ]; then
  # Подгружаем токен Telegram-бота для алертов (если не задан в backend/.env)
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    TELEGRAM_BOT_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "${PROJECT_ROOT}/sms-gateway/.env" | cut -d '=' -f2- | tr -d '\"' || true)"
  fi
  if [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    TELEGRAM_CHAT_ID="$(grep -E '^TELEGRAM_CHAT_ID=' "${PROJECT_ROOT}/sms-gateway/.env" | cut -d '=' -f2- | tr -d '\"' || true)"
  fi
fi

# Метка времени для именования файлов
DATE_STR="$(date +%Y%m%d_%H%M%S)"
STATUS_FILE="${BACKUP_BASE_DIR}/last_backup_status.json"
START_TIME="$(date +%s)"

echo "======================================================================"
echo "🕒 [$(date '+%Y-%m-%d %H:%M:%S')] Запуск резервного копирования всех БД..."
echo "======================================================================"

# Массив для сбора статусов по каждой БД
STATUS_VIASGLOBAL="unknown"
STATUS_RENT="unknown"
STATUS_ECOMMERCE="unknown"
ERROR_MESSAGES=()

# ------------------------------------------------------------------------------
# Функция выгрузки файла в S3 / Cloudflare R2 через официальный образ aws-cli
# ------------------------------------------------------------------------------
upload_to_s3() {
  local LOCAL_FILE="$1"
  local S3_PATH="$2"

  # Проверяем, заданы ли обязательные учетные данные AWS / R2
  if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && [ -n "${AWS_BACKUP_BUCKET:-}" ]; then
    echo "☁️  Выгрузка ${LOCAL_FILE} в S3 (${AWS_BACKUP_BUCKET}/${S3_PATH})..."

    # Подготавливаем аргументы для кастомного S3 Endpoint (например, Cloudflare R2 или MinIO)
    local ENDPOINT_FLAG=()
    if [ -n "${S3_ENDPOINT_URL:-}" ]; then
      ENDPOINT_FLAG=("--endpoint-url" "${S3_ENDPOINT_URL}")
    fi

    local DIR_NAME="$(dirname "${LOCAL_FILE}")"
    local BASE_NAME="$(basename "${LOCAL_FILE}")"

    # Запускаем официальный CLI в изолированном контейнере Docker
    if docker run --rm \
      -v "${DIR_NAME}:/data:ro" \
      -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
      -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
      -e AWS_DEFAULT_REGION="${AWS_BACKUP_REGION:-auto}" \
      amazon/aws-cli s3 cp "/data/${BASE_NAME}" "s3://${AWS_BACKUP_BUCKET}/${S3_PATH}" "${ENDPOINT_FLAG[@]}"; then

      echo "✅ Файл ${BASE_NAME} успешно загружен в S3!"
      return 0
    else
      echo "❌ Ошибка выгрузки в S3 для ${BASE_NAME}"
      return 1
    fi
  else
    echo "ℹ️  Ключи AWS/R2 не настроены в .env, выгрузка в облако пропущена."
    return 0
  fi
}

# ==============================================================================
# 1. Резервное копирование основной БД: viasglobal_db (backend-db-1)
# ==============================================================================
echo "📦 [1/3] Создание дампа viasglobal_db..."
VIAS_FILE="${BACKUP_BASE_DIR}/viasglobal/viasglobal_db_${DATE_STR}.sql.gz"
if docker ps --format '{{.Names}}' | grep -q '^backend-db-1$'; then
  # Снимаем дамп через pg_dump внутри контейнера и пакуем gzip на лету
  if docker exec backend-db-1 pg_dump -U viasuser viasglobal_db | gzip > "${VIAS_FILE}"; then
    # Проверяем целостность полученного архива gzip
    if gzip -t "${VIAS_FILE}"; then
      VIAS_SIZE="$(stat -f%z "${VIAS_FILE}" 2>/dev/null || stat -c%s "${VIAS_FILE}" 2>/dev/null || echo 0)"
      echo "✅ Дамп viasglobal_db успешно создан и проверен (размер: $((VIAS_SIZE / 1024 / 1024)) МБ)"
      if upload_to_s3 "${VIAS_FILE}" "viasglobal/$(basename "${VIAS_FILE}")"; then
        STATUS_VIASGLOBAL="success"
      else
        STATUS_VIASGLOBAL="warning_s3_failed"
        ERROR_MESSAGES+=("viasglobal_db: сбой выгрузки в S3")
      fi
    else
      echo "❌ Архив ${VIAS_FILE} поврежден (ошибка gzip)!"
      STATUS_VIASGLOBAL="corrupted"
      ERROR_MESSAGES+=("viasglobal_db: битый gzip архив")
    fi
  else
    echo "❌ Ошибка при выполнении pg_dump для viasglobal_db"
    STATUS_VIASGLOBAL="dump_failed"
    ERROR_MESSAGES+=("viasglobal_db: ошибка pg_dump")
  fi
else
  echo "⚠️ Контейнер backend-db-1 не запущен, пропуск viasglobal_db!"
  STATUS_VIASGLOBAL="container_down"
  ERROR_MESSAGES+=("viasglobal_db: контейнер backend-db-1 остановлен")
fi

# ==============================================================================
# 2. Резервное копирование БД аренды: accruals-postgres (accountant, watcher, bot)
# ==============================================================================
echo "📦 [2/3] Создание дампа accruals-postgres (rent)..."
RENT_FILE="${BACKUP_BASE_DIR}/rent/rent_all_${DATE_STR}.sql.gz"
if docker ps --format '{{.Names}}' | grep -q '^accruals-postgres$'; then
  # Снимаем полный кластер баз данных через pg_dumpall
  if docker exec accruals-postgres pg_dumpall -U postgres | gzip > "${RENT_FILE}"; then
    if gzip -t "${RENT_FILE}"; then
      RENT_SIZE="$(stat -f%z "${RENT_FILE}" 2>/dev/null || stat -c%s "${RENT_FILE}" 2>/dev/null || echo 0)"
      echo "✅ Дамп rent_all успешно создан и проверен (размер: $((RENT_SIZE / 1024 / 1024)) МБ)"
      if upload_to_s3 "${RENT_FILE}" "rent/$(basename "${RENT_FILE}")"; then
        STATUS_RENT="success"
      else
        STATUS_RENT="warning_s3_failed"
        ERROR_MESSAGES+=("rent: сбой выгрузки в S3")
      fi
    else
      echo "❌ Архив ${RENT_FILE} поврежден (ошибка gzip)!"
      STATUS_RENT="corrupted"
      ERROR_MESSAGES+=("rent: битый gzip архив")
    fi
  else
    echo "❌ Ошибка при выполнении pg_dumpall для accruals-postgres"
    STATUS_RENT="dump_failed"
    ERROR_MESSAGES+=("rent: ошибка pg_dumpall")
  fi
else
  echo "⚠️ Контейнер accruals-postgres не запущен, пропуск rent!"
  STATUS_RENT="container_down"
  ERROR_MESSAGES+=("rent: контейнер accruals-postgres остановлен")
fi

# ==============================================================================
# 3. Резервное копирование БД E-Commerce: ecommerce-db (ecommerce_db)
# ==============================================================================
echo "📦 [3/3] Создание дампа ecommerce-db..."
ECOM_FILE="${BACKUP_BASE_DIR}/ecommerce/ecommerce_db_${DATE_STR}.sql.gz"
if docker ps --format '{{.Names}}' | grep -q '^ecommerce-db$'; then
  # Снимаем дамп базы ecommerce_db
  if docker exec ecommerce-db pg_dump -U viasuser ecommerce_db | gzip > "${ECOM_FILE}"; then
    if gzip -t "${ECOM_FILE}"; then
      ECOM_SIZE="$(stat -f%z "${ECOM_FILE}" 2>/dev/null || stat -c%s "${ECOM_FILE}" 2>/dev/null || echo 0)"
      echo "✅ Дамп ecommerce_db успешно создан и проверен (размер: $((ECOM_SIZE / 1024 / 1024)) МБ)"
      if upload_to_s3 "${ECOM_FILE}" "ecommerce/$(basename "${ECOM_FILE}")"; then
        STATUS_ECOMMERCE="success"
      else
        STATUS_ECOMMERCE="warning_s3_failed"
        ERROR_MESSAGES+=("ecommerce: сбой выгрузки в S3")
      fi
    else
      echo "❌ Архив ${ECOM_FILE} поврежден (ошибка gzip)!"
      STATUS_ECOMMERCE="corrupted"
      ERROR_MESSAGES+=("ecommerce: битый gzip архив")
    fi
  else
    echo "❌ Ошибка при выполнении pg_dump для ecommerce_db"
    STATUS_ECOMMERCE="dump_failed"
    ERROR_MESSAGES+=("ecommerce: ошибка pg_dump")
  fi
else
  echo "⚠️ Контейнер ecommerce-db не запущен, пропуск ecommerce!"
  STATUS_ECOMMERCE="container_down"
  ERROR_MESSAGES+=("ecommerce: контейнер ecommerce-db остановлен")
fi

# ==============================================================================
# 4. Ротация локальных файлов (удаление бэкапов старше 30 дней)
# ==============================================================================
echo "🧹 Ротация старых локальных архивов (храним 30 дней)..."
find "${BACKUP_BASE_DIR}" -type f -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true

END_TIME="$(date +%s)"
TOTAL_DURATION=$((END_TIME - START_TIME))

# ==============================================================================
# 5. Запись структурированного отчета о бэкапе в JSON
# ==============================================================================
cat <<EOF > "${STATUS_FILE}"
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "durationSeconds": ${TOTAL_DURATION},
  "overallStatus": "$([ ${#ERROR_MESSAGES[@]} -eq 0 ] && echo "healthy" || echo "unhealthy")",
  "databases": {
    "viasglobal_db": {
      "status": "${STATUS_VIASGLOBAL}",
      "file": "$(basename "${VIAS_FILE}")",
      "sizeBytes": $(stat -f%z "${VIAS_FILE}" 2>/dev/null || stat -c%s "${VIAS_FILE}" 2>/dev/null || echo 0)
    },
    "rent": {
      "status": "${STATUS_RENT}",
      "file": "$(basename "${RENT_FILE}")",
      "sizeBytes": $(stat -f%z "${RENT_FILE}" 2>/dev/null || stat -c%s "${RENT_FILE}" 2>/dev/null || echo 0)
    },
    "ecommerce": {
      "status": "${STATUS_ECOMMERCE}",
      "file": "$(basename "${ECOM_FILE}")",
      "sizeBytes": $(stat -f%z "${ECOM_FILE}" 2>/dev/null || stat -c%s "${ECOM_FILE}" 2>/dev/null || echo 0)
    }
  },
  "errors": $(if [ ${#ERROR_MESSAGES[@]} -eq 0 ]; then echo "[]"; else printf '%s\n' "${ERROR_MESSAGES[@]}" | jq -R . | jq -s . 2>/dev/null || echo "[]"; fi)
}
EOF


echo "📄 Статус резервного копирования сохранен в ${STATUS_FILE}"

# ==============================================================================
# 6. Запуск скрипта хелсчека и отправка уведомлений
# ==============================================================================
if [ -f "${SCRIPT_DIR}/check-health.sh" ]; then
  echo "🔍 Запуск хелсчека бэкапов..."
  bash "${SCRIPT_DIR}/check-health.sh" || true
fi

echo "======================================================================"
echo "🏁 [$(date '+%Y-%m-%d %H:%M:%S')] Резервное копирование завершено за ${TOTAL_DURATION} сек."
echo "======================================================================"

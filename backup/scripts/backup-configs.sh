#!/usr/bin/env bash
# ==============================================================================
# Скрипт безопасного резервного копирования конфигурационных файлов (.env)
#
# Назначение:
# Находит все боевые .env файлы микросервисов кластера, упаковывает их
# в архив configs_YYYYMMDD_HHMMSS.tar.gz и выгружает в закрытый приватный
# бакет Cloudflare R2 (viasglobal-backups/configs/).
#
# Это гарантирует, что при физическом выходе сервера из строя (сгорании диска)
# на новом компьютере можно будет восстановить не только базы данных,
# но и все боевые API-ключи, токены и конфигурации микросервисов.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_BASE_DIR="${PROJECT_ROOT}/backend/backups"
CONFIGS_BACKUP_DIR="${BACKUP_BASE_DIR}/configs"

# Загружаем переменные S3/R2 из backend/.env
if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
  # Экспортируем только нужные параметры AWS/S3
  eval "$(grep -E '^(AWS_BACKUP_BUCKET|AWS_BACKUP_REGION|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|S3_ENDPOINT_URL)=' "${PROJECT_ROOT}/backend/.env" | sed 's/^/export /')"
fi

mkdir -p "${CONFIGS_BACKUP_DIR}"

DATE_STR="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_FILE="${CONFIGS_BACKUP_DIR}/configs_${DATE_STR}.tar.gz"

echo "======================================================================"
echo "🔐 [$(date '+%Y-%m-%d %H:%M:%S')] Архивирование конфигурационных файлов (.env)..."
echo "======================================================================"

cd "${PROJECT_ROOT}"

# Собираем список всех существующих .env файлов проекта (исключая .example и node_modules)
ENV_FILES=()
while IFS= read -r file; do
  if [ -f "${file}" ]; then
    ENV_FILES+=("${file}")
  fi
done < <(find . -maxdepth 4 -name ".env" -o -name ".env.local" 2>/dev/null | grep -v "/node_modules/" | grep -v "/.git/" | sort)

if [ ${#ENV_FILES[@]} -eq 0 ]; then
  echo "⚠️ Не найдено ни одного .env файла для архивации!"
  exit 0
fi

echo "📋 Найдено ${#ENV_FILES[@]} конфигурационных файлов:"
for f in "${ENV_FILES[@]}"; do
  echo "   📄 ${f}"
done

# Создаем сжатый tar.gz архив со всеми .env файлами (сохраняя структуру путей)
tar -czf "${ARCHIVE_FILE}" "${ENV_FILES[@]}"

if gzip -t "${ARCHIVE_FILE}"; then
  ARCHIVE_SIZE="$(stat -f%z "${ARCHIVE_FILE}" 2>/dev/null || stat -c%s "${ARCHIVE_FILE}" 2>/dev/null || echo 0)"
  echo "✅ Архив конфигураций успешно создан: $(basename "${ARCHIVE_FILE}") (${ARCHIVE_SIZE} байт)"
else
  echo "❌ Ошибка при создании архива ${ARCHIVE_FILE}"
  exit 1
fi

# Выгрузка архива конфигураций в Cloudflare R2
if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_SECRET_ACCESS_KEY:-}" ] && [ -n "${AWS_BACKUP_BUCKET:-}" ]; then
  echo "☁️  Выгрузка архива конфигураций в Cloudflare R2 (s3://${AWS_BACKUP_BUCKET}/configs/)..."
  ENDPOINT_FLAG=()
  if [ -n "${S3_ENDPOINT_URL:-}" ]; then
    ENDPOINT_FLAG=("--endpoint-url" "${S3_ENDPOINT_URL}")
  fi

  DIR_NAME="$(dirname "${ARCHIVE_FILE}")"
  BASE_NAME="$(basename "${ARCHIVE_FILE}")"

  if docker run --rm \
    -v "${DIR_NAME}:/data:ro" \
    -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
    -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
    -e AWS_DEFAULT_REGION="${AWS_BACKUP_REGION:-auto}" \
    amazon/aws-cli s3 cp "/data/${BASE_NAME}" "s3://${AWS_BACKUP_BUCKET}/configs/${BASE_NAME}" "${ENDPOINT_FLAG[@]}"; then
    echo "✅ Архив конфигураций успешно загружен в Cloudflare R2!"
  else
    echo "❌ Ошибка загрузки архива конфигураций в Cloudflare R2"
  fi
fi

# Ротация старых локальных архивов конфигураций (храним последние 30 дней)
find "${CONFIGS_BACKUP_DIR}" -type f -name "configs_*.tar.gz" -mtime +30 -delete 2>/dev/null || true
echo "======================================================================"

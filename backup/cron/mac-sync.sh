#!/usr/bin/env bash
# ==============================================================================
# Скрипт синхронизации бэкапов с сервера Huawei на текущий ПК (Mac)
#
# Скачивает свежие архивы всех баз данных (viasglobal_db, rent)
# и статус-файлы хелсчека с сервера Huawei через rsync по защищенной сети Tailscale.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOCAL_BACKUP_DIR="${PROJECT_ROOT}/ecommerce/backend/backups"
REMOTE_SERVER="huawei@100.92.50.18"
REMOTE_BACKUP_DIR="~/viasglobal/ecommerce/backend/backups/"

echo "======================================================================"
echo "📥 Синхронизация бэкапов с сервера Huawei (${REMOTE_SERVER})..."
echo "======================================================================"

mkdir -p "${LOCAL_BACKUP_DIR}/viasglobal"
mkdir -p "${LOCAL_BACKUP_DIR}/rent"
mkdir -p "${LOCAL_BACKUP_DIR}/configs"

# Запускаем rsync для скачивания свежих архивов по подпроектам, конфигураций .env и отчетов JSON
# Исключаем старые неструктурированные дампы корня backups/
rsync -avz --progress \
  --include="viasglobal/***" \
  --include="rent/***" \
  --include="configs/***" \
  --include="*.json" \
  --exclude="backup_*.sql.gz" \
  --exclude="*" \
  "${REMOTE_SERVER}:${REMOTE_BACKUP_DIR}" "${LOCAL_BACKUP_DIR}/"


echo "✅ Синхронизация бэкапов на локальный ПК успешно завершена!"
echo "📁 Список локальных архивов:"
ls -lh "${LOCAL_BACKUP_DIR}"/*/*.sql.gz 2>/dev/null || ls -lh "${LOCAL_BACKUP_DIR}"/*.sql.gz 2>/dev/null || true
echo "======================================================================"

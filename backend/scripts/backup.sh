#!/bin/bash
set -a
source .env
set +a

# Убираем параметры запроса из DATABASE_URL (например, ?schema=public), так как pg_dump их не поддерживает
CLEAN_URL="${DATABASE_URL%%\?*}"

mkdir -p backups
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Создание бэкапа базы данных: $BACKUP_FILE"
pg_dump "$CLEAN_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Бэкап успешно завершен."
else
  echo "Ошибка при создании бэкапа."
  exit 1
fi

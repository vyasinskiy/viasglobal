#!/bin/bash
set -a
source .env
set +a

# Убираем параметры запроса из DATABASE_URL (например, ?schema=public)
CLEAN_URL="${DATABASE_URL%%\?*}"

mkdir -p backups
DATE_STR=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backups/backup_${DATE_STR}.sql"
GZIP_FILE="${BACKUP_FILE}.gz"
FILENAME="backup_${DATE_STR}.sql.gz"

echo "Создание бэкапа базы данных..."
docker exec backend-db-1 pg_dump "$CLEAN_URL" | gzip > "$GZIP_FILE"

if [ $? -eq 0 ] && [ -f "$GZIP_FILE" ]; then
  echo "Бэкап успешно создан и сжат: $GZIP_FILE"
  
  if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    echo "Отправка архива в Amazon S3 ($AWS_BACKUP_BUCKET)..."
    docker run --rm -v $(pwd)/backups:/backups \
      -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
      -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
      -e AWS_DEFAULT_REGION="$AWS_BACKUP_REGION" \
      amazon/aws-cli s3 cp "/backups/${FILENAME}" "s3://${AWS_BACKUP_BUCKET}/${FILENAME}"
      
    if [ $? -eq 0 ]; then
      echo "Бэкап успешно загружен в S3!"
    else
      echo "Ошибка при загрузке в S3!"
      # Не выходим с ошибкой, так как локальный бэкап всё же есть
    fi
  else
    echo "S3 ключи не найдены в .env, выгрузка пропущена."
  fi
else
  echo "Ошибка при создании бэкапа."
  exit 1
fi

# Удаляем локальные бэкапы старше 30 дней, чтобы не забивать диск сервера
find backups/ -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;
echo "Старые бэкапы удалены."

#!/bin/sh
set -e

echo "Ожидание готовности базы данных ecommerce_db..."
RETRIES=15
until npx prisma db execute --stdin <<EOF >/dev/null 2>&1
SELECT 1;
EOF
do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "❌ Ошибка: Не удалось подключиться к базе данных ecommerce_db"
    exit 1
  fi
  echo "База данных еще не готова, повтор через 2 сек..."
  sleep 2
done

echo "✅ База данных готова!"
echo "Применение миграций Prisma..."
npx prisma migrate deploy

echo "Загрузка начальных данных (сидинг)..."
npx prisma db execute --file prisma/sql/seed.sql

echo "✅ Инициализация базы данных ecommerce_db успешно завершена!"

#!/bin/bash
# Скрипт развертывания персонального AI-ассистента (Hermes Agent)
set -e

echo "🚀 Развертывание сервиса viasglobal-hermes..."

# 1. Проверяем наличие файла .env
if [ ! -f .env ]; then
    echo "⚠️ Файл .env не найден! Создайте .env на основе .env.example и укажите TELEGRAM_BOT_TOKEN."
    exit 1
fi

# 2. Создаем директорию данных SQLite, если она еще не создана
mkdir -p data

# 3. Проверяем и создаем Docker-сети интеграции, если они еще не существуют
echo "🌐 Проверка Docker-сетей..."
docker network inspect infra_accruals-network >/dev/null 2>&1 || docker network create infra_accruals-network
docker network inspect backend_default >/dev/null 2>&1 || docker network create backend_default

# 4. Сборка и перезапуск контейнера
echo "📦 Сборка и запуск контейнера viasglobal-hermes..."
docker compose up -d --build

echo "✅ Сервис viasglobal-hermes успешно запущен!"
docker compose ps


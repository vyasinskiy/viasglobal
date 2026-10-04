#!/bin/bash
# Скрипт развертывания AI-ассистента на платформе OpenClaw
set -e

echo "🚀 Развертывание сервиса viasglobal-openclaw..."

# 1. Проверяем наличие файла .env
if [ ! -f .env ]; then
    echo "⚠️ Файл .env не найден! Создайте .env на основе .env.example и укажите TELEGRAM_BOT_TOKEN."
    exit 1
fi

# 2. Загружаем переменные из .env
set -a
source .env
set +a

# 3. Создаем директорию данных для пользователя node (uid 1000)
mkdir -p data/workspace

# 4. Генерируем актуальный openclaw.json из шаблона с подстановкой ключей
echo "⚙️ Генерация конфигурации openclaw.json..."
sed \
  -e "s|\${OPENROUTER_API_KEY}|${OPENROUTER_API_KEY}|g" \
  -e "s|\${OPENCLAW_GATEWAY_TOKEN}|${OPENCLAW_GATEWAY_TOKEN}|g" \
  -e "s|\${TELEGRAM_BOT_TOKEN}|${TELEGRAM_BOT_TOKEN}|g" \
  -e "s|\${TELEGRAM_ALLOWED_USERS}|${TELEGRAM_ALLOWED_USERS:-743866013}|g" \
  config/openclaw.template.json > data/openclaw.json
cp -f data/openclaw.json data/openclaw.json.last-good
rm -f data/openclaw.json.bak* data/openclaw.json.clobbered*

# 5. Синхронизируем документацию сервисов и инструкции в workspace OpenClaw
echo "📚 Копирование документации по сервисам и инструкций в workspace..."
if [ -f ../docs/SERVICES.md ]; then
  cp ../docs/SERVICES.md data/workspace/SERVICES.md
elif [ -f docs/SERVICES.md ]; then
  cp docs/SERVICES.md data/workspace/SERVICES.md
fi

if [ -d config/workspace ]; then
  cp -rf config/workspace/* data/workspace/
fi

# Удаляем устаревший BOOTSTRAP.md, чтобы агент сразу перешел к боевому режиму
rm -f data/workspace/BOOTSTRAP.md

# 6. Проверяем и создаем Docker-сети интеграции, если они еще не существуют
echo "🌐 Проверка Docker-сетей..."
docker network inspect infra_accruals-network >/dev/null 2>&1 || docker network create infra_accruals-network
docker network inspect backend_default >/dev/null 2>&1 || docker network create backend_default

# 7. Настройка прав для пользователя node в контейнере
chmod -R 777 data

# 8. Запуск контейнера OpenClaw
echo "📦 Запуск контейнера viasglobal-openclaw..."
docker compose up -d --force-recreate

echo "✅ Сервис viasglobal-openclaw успешно запущен!"
docker compose ps

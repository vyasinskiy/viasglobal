# Базовый образ Node.js 22 на базе Alpine Linux
FROM node:22-alpine

# Установка Android Debug Bridge (adb) и curl для проверки здоровья
RUN apk add --no-cache android-tools curl tzdata

# Установка часового пояса
ENV TZ=Europe/Madrid

# Рабочая директория приложения
WORKDIR /app

# Копирование описания проекта и зависимостей
COPY package.json tsconfig.json ./

# Копирование исходного кода
COPY src/ ./src/

# Создание директории для данных и логов
RUN mkdir -p /app/data

# Экспонируем порт REST API
EXPOSE 3040

# Проверка работоспособности контейнера через curl /health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3040/health || exit 1

# Запуск приложения на Node.js 22 с нативной поддержкой TypeScript
CMD ["node", "--experimental-strip-types", "src/index.ts"]

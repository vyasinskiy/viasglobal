# ==============================================================================
# Multi-stage Dockerfile для веб-сервиса Viaslangs (Next.js App Router)
# ==============================================================================

# Этап 1: Сборка production-бандла Next.js
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем манифесты зависимостей и устанавливаем пакеты
COPY package*.json ./
RUN npm ci

# Копируем исходный код приложения
COPY . .

# Собираем оптимизированный продакшен-билд
RUN npm run build

# Этап 2: Финальный легковесный runtime-образ
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Копируем артефакты сборки и необходимые зависимости
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env.local ./.env.local

# Открываем рабочий порт приложения
EXPOSE 3000

# Запуск Next.js сервера
CMD ["npm", "run", "start"]


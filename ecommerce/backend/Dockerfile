FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
# Копируем схему prisma
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Генерируем prisma клиента
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Копируем собранные файлы и зависимости из первого этапа
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 3000

# Запускаем приложение
CMD ["npm", "run", "start:prod"]

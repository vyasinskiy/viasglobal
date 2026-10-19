FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .

# Передаем переменную окружения API на этапе сборки Next.js (inline для клиента)
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
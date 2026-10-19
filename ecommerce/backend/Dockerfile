FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
ENV DATABASE_URL="postgresql://viasuser:viaspassword@db:5432/ecommerce_db?schema=public"
RUN npx prisma generate
RUN npm run build

EXPOSE 3001
CMD ["node", "dist/main.js"]
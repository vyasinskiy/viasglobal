# Модуль E-Commerce CRM / ERP (Viasglobal)

Данный сервис представляет собой полноценную систему управления товарным каталогом, закупками, поставщиками, складскими остатками, продажами на внешних маркетплейсах (Amazon, Etsy) и аналитикой маржинальности.

## Архитектура сервиса

Сервис состоит из трех основных компонентов:
1. **`backend`**: REST API на базе **NestJS**, Prisma ORM 7, PostgreSQL, JWT-аутентификации.
2. **`admin`**: Веб-интерфейс панели управления на базе **Next.js 16 (App Router)**, React 19, Material UI (MUI v7), Recharts.
3. **`db`**: Выделенная база данных PostgreSQL 16 (`ecommerce_db`).

---

## Стек технологий

- **Бэкенд**: Node.js 22, NestJS 11, Prisma 7, PostgreSQL, Passport JWT, Bcrypt, Multer.
- **Фронтенд**: Next.js 16, React 19, Material UI 7, Recharts, TypeScript.
- **Инфраструктура**: Docker Compose, Docker Networks (`ecommerce-net`, `infra_accruals-network`), Cloudflare Tunnel.

---

## Сетевая конфигурация и порты

| Компонент | Контейнер | Внутренний порт | Порт хоста (Huawei) | Назначение |
| :--- | :--- | :--- | :--- | :--- |
| **Backend API** | `ecommerce-backend` | `3001` | `3010` | REST API сервиса, бизнес-логика, авторизация, загрузка документов |
| **Admin UI** | `ecommerce-admin` | `3000` | `3020` | Панель администратора Next.js с проксированием `/api/*` |
| **PostgreSQL** | `ecommerce-db` | `5432` | `5434` | База данных `ecommerce_db` |

### Доступ через Cloudflare Tunnel
- Домен панели администратора: `https://crm.viasglobal.es` (или `https://ecommerce.viasglobal.es`).
- Запросы из браузера к `/api/*` прозрачно проксируются Next.js сервером на `http://backend:3001/*` внутри Docker-сети `ecommerce-net`, что устраняет проблемы с CORS.
- Автономные AI-ассистенты (OpenClaw, Hermes) могут обращаться к бэкенду напрямую по имени контейнера `http://ecommerce-backend:3001` через общую сеть `infra_accruals-network`.

---

## Локальный запуск и разработка

```bash
# 1. Установка зависимостей
make install

# 2. Запуск контейнеров БД и сервисов
make up

# 3. Применение миграций и загрузка начальных данных (Admin, платформы)
make reset-db

# 4. Локальный запуск в режиме разработки
make dev
```

Данные администратора по умолчанию после сидинга:
- **Email**: `admin@viasglobal.com`
- **Пароль**: `admin123`

---

## Развертывание на сервере Huawei

Развертывание осуществляется через корневой `Makefile`:
```bash
# Развертывание с применением миграций и сидинга
make deploy-ecommerce

# Быстрая пересборка и перезапуск контейнеров без сброса БД
make redeploy-ecommerce
```

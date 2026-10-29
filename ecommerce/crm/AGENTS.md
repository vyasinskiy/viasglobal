# Правила и инструкции для подпроекта Viasglobal E-Commerce CRM (`ecommerce/crm`)

## Назначение подпроекта

`ecommerce/crm` — это веб-интерфейс панели управления **Viasglobal E-Commerce CRM & WMS** (`https://crm.viasglobal.es`), построенный на базе **Next.js 13 (App Router)**, **React 18**, **Material UI (MUI)** и **SWR**.
Приложение выступает единым рабочим местом для:
1. Отслеживания юнит-экономики товаров брендов на контракте (`ContractedFilteredProductsView` и `ContractedAllProductsView`) с переключением налогового режима (`Autónomo Recargo de Equivalencia 1.262` vs `SL / Sociedad Limitada`) и контролем свежести снапшотов Keepa (порог 48 часов).
2. Анализа пула оптовых кандидатов (`CandidatesProductsView` / `WholesaleCandidatesView`) и реестра `AsinView`.
3. Управления воронкой B2B поставщиков (`Distributor`, `DistributorContact`), просмотра синхронизированной переписки из почты Hostinger IMAP (`DistributorEmail`, строго в режиме Read-Only) и снапшотов прайс-листов (`DistributorPriceSnapshot`).
4. Управления брендами (`Brand`), связками приватных лейблов (`PrivateLabelView`) и маппингом вариаций производителей из Keepa (`Manufacturer` и `ManufacturerAlias`).
5. Учета заказов поставщикам (`PurchaseOrder`), накладных *Albarán*, замеров заводских коробок и проведения приемки поставок с разделением между складами (`SVH` — 3 шт по дефолту, `MAIN` — остаток).
6. Контроля складских остатков (`WarehouseStock`), автоматических алертов пополнения буфера СВХ (при остатке $\le 1$ шт), внутренних перемещений (`MAIN` $\to$ `SVH`) и журнала движений (`StockMovement`).
7. Регистрации продаж на маркетплейсах (`SalesOrder`) со списанием с СВХ и сквозной прослеживаемостью партий поставщика по методу FIFO (`BatchSalesAllocation`).
8. Мониторинга персистентных очередей Keepa API (`KeepaRequestQueue`, `RequestProductQueue`, `AnalysisProductQueue`), разрешенных категорий и здоровья бэкапов.

## Архитектура, сеть и деплой

- **Имя Docker-контейнера**: `ecommerce-admin` (определено в `ecommerce/backend/docker-compose.yml`).
- **Внутренний порт**: `3000` (используется Cloudflare Tunnel `cloudflared` по правилу `https://crm.viasglobal.es` $\to$ `http://ecommerce-admin:3000`).
- **Внешний порт на хосте Huawei**: `3006` (`3006:3000`).
- **Подключенные сети Docker**:
  - `backend_default` (для прямого обращения BFF-прокси `/api/backend/[...path]` к `http://backend:3000`).
  - `infra_accruals-network` (внешняя сеть, в которой работает контейнер `cloudflared` и автономный агент `viasglobal-openclaw`).
- **Аутентификация**:
  - Защищена паролем администратора (`ADMIN_PASSWORD`, по умолчанию `viasglobal`) через `middleware.ts` и подписанную HMAC-SHA256 сессионную куку `vias_crm_session` со скользящим продлением на 400 дней.
  - Также поддерживает заголовок `x-app-password: viasglobal` для вызовов со стороны ИИ-агентов и проверок.
- **Команды деплоя в корневом `Makefile`**:
  - `make redeploy-crm` — синхронизация `ecommerce/crm` и `ecommerce/backend/docker-compose.yml` на сервер Huawei и пересборка контейнера `ecommerce-admin`.
  - `make deploy-master` — полный деплой бэкенда и CRM на сервер Huawei.

## Строгие правила безопасности данных

- **Почта строго Read-Only**: Просмотр писем `DistributorEmail` работает исключительно на чтение. Отправка исходящих писем через CRM или скрипты категорически запрещена.
- **Подтверждение мутаций**: Любые изменяющие действия в интерфейсе (смена статуса бренда или дистрибьютора, проведение приемки, перемещение между складами, регистрация продажи, экстренный запрос Keepa) требуют явного подтверждения пользователем.


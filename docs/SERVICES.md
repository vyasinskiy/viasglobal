# Реестр микросервисов и API эндпоинтов Viasglobal

В данном документе описана архитектура локальной инфраструктуры кластера Viasglobal, перечень запущенных Docker-контейнеров, сетевые связки и спецификация всех доступных внутренних HTTP REST эндпоинтов.

> [!IMPORTANT]
> Данный файл является единым источником правды для AI-агентов (OpenClaw, Hermes) и разработчиков.
> Управление микросервисами может осуществляться по HTTP с помощью автономных ИИ-агентов.
> **Критическое требование**: любые эндпоинты обязаны всегда возвращать полный структурированный ответ (`status`, `message`, `error`, `errors`, сводные счетчики) для качественной диагностики без необходимости чтения сырых логов.
> При добавлении, изменении или удалении сервисов, портов или эндпоинтов в репозитории **обязательно** синхронно обновлять этот документ.

---

## 1. Топология сетей Docker

Все микросервисы объединены в две основные изолированные bridge-сети Docker на сервере:

1. **`infra_accruals-network`**: Сеть учета аренды и коммунальных платежей (`rent`).
   - Контейнеры: `accruals-accountant`, `accruals-watcher`, `accruals-telegram-bot`, `accruals-rabbitmq`, `accruals-postgres`, `accruals-admin-ui`, `viasglobal-openclaw`, `viasglobal-hermes`.
2. **`backend_default`**: Сеть основного бэкенда каталога Wholesale и парсинга Keepa (`backend`).
   - Контейнеры: `backend`, `viasglobal-openclaw`, `viasglobal-hermes`.

AI-ассистенты `viasglobal-openclaw` и `viasglobal-hermes` подключены к **обеим сетям**, поэтому могут обращаться к любому сервису по его прямому Docker DNS-имени без выхода в публичный интернет.

---

## 2. Сводная таблица контейнеров и портов

| Сервис | Docker DNS имя | Внутренний порт | Внешний порт (хост) | Назначение |
| :--- | :--- | :--- | :--- | :--- |
| **Accountant Service** | `accruals-accountant` | `3005` | `3005` | Учет аренды, начисления, квитанции, платежи, арендаторы |
| **Watcher Service** | `accruals-watcher` | `4500` | `4500` | Парсинг коммунальных порталов через Playwright |
| **Backend API** | `backend` | `3000` | `3000` | Amazon Wholesale, бренды, дистрибьюторы, Keepa очереди |
| **Admin UI (Rent)** | `accruals-admin-ui` | `3000` | `3000` (`https://rent.viasglobal.es`) | Веб-интерфейс панели администратора аренды (Next.js/MUI) |
| **RabbitMQ** | `accruals-rabbitmq` | `5672`, `15672` | `5672`, `15672` | Очередь событий и веб-консоль управления (guest/guest) |
| **PostgreSQL** | `accruals-postgres` | `5432` | `5432` | Базы данных `accountant_db`, `watcher_db`, `telegram_bot_db` |
| **Telegram Bot Rent** | `accruals-telegram-bot`| - | - | Бот арендаторов и администраторов аренды |
| **Visual Browser** | `accruals-visual-browser` | `3000` | `3002` (`https://browser.viasglobal.es`) | Удаленный визуальный Chromium с веб-доступом (KasmVNC) для авторизации по SMS/паролю |
| **Hermes Agent** | `viasglobal-hermes` | - | - | Голосовой AI-ассистент с локальным STT Whisper |
| **OpenClaw Agent** | `viasglobal-openclaw` | `18789` | `18789` | Автономный AI-ассистент в Telegram |

---

## 3. API сервиса Accruals Accountant (`accruals-accountant:3005`)

Базовый URL изнутри Docker-сети: `http://accruals-accountant:3005`

### 3.1. Статистика и аналитика

- **`GET /accountant/stats`**
  - **Описание**: Получить сводную статистику платежей, задолженностей и предстоящих событий.
  - **Пример запроса**:
    ```bash
    curl -s http://accruals-accountant:3005/accountant/stats
    ```
  - **Пример ответа**:
    ```json
    { "totalPayments": 12, "pendingPayments": 1, "upcomingEvents": 0 }
    ```

---

### 3.2. Арендаторы (`/accountant/tenants`)

- **`GET /accountant/tenants`**
  - **Описание**: Список всех арендаторов.
  - **Query-параметры**: `includeDeleted` (`true` или `false`, по умолчанию `false`).
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/tenants"
    ```

- **`GET /accountant/tenants/:id`**
  - **Описание**: Получить детальные данные арендатора по числовому ID.
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/tenants/1"
    ```

- **`POST /accountant/tenants`**
  - **Описание**: Создание нового арендатора.
  - **Тело запроса (JSON)**:
    ```json
    {
      "name": "Иван Иванов",
      "apartmentId": 1,
      "rentPaymentDay": 5,
      "rentAmount": 450
    }
    ```
  - **Пример**:
    ```bash
    curl -s -X POST http://accruals-accountant:3005/accountant/tenants \
      -H "Content-Type: application/json" \
      -d '{"name":"Иван Иванов","apartmentId":1,"rentPaymentDay":5,"rentAmount":450}'
    ```

- **`PUT /accountant/tenants/:id`**
  - **Описание**: Обновление данных арендатора (имя, квартира, день оплаты, сумма, статус).
  - **Тело запроса (JSON)**:
    ```json
    {
      "name": "Иван Иванов",
      "apartmentId": 1,
      "rentPaymentDay": 10,
      "rentAmount": 500,
      "status": "ACTIVE"
    }
    ```

- **`DELETE /accountant/tenants/:id`**
  - **Описание**: Мягкое или жесткое удаление арендатора.
  - **Query-параметры**: `force=true` (для полного каскадного удаления из БД).

---

### 3.3. Квартиры и недвижимость (`/accountant/apartments`)

- **`GET /accountant/apartments`**
  - **Описание**: Список всех квартир с привязанными счетами, текущими арендаторами и балансом.
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/apartments"
    ```

- **`GET /accountant/apartments/:id`**
  - **Описание**: Получить информацию по конкретной квартире.

- **`DELETE /accountant/apartments/:id`**
  - **Описание**: Удаление квартиры.

---

### 3.4. Коммунальные лицевые счета (`/accountant/accounts`)

- **`GET /accountant/accounts`**
  - **Описание**: Список коммунальных счетов (электричество, вода, газ, интернет, вывоз мусора).
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/accounts"
    ```

- **`GET /accountant/accounts/:id`**
  - **Описание**: Детали конкретного счета по ID.

- **`PUT /accountant/accounts/:id`**
  - **Описание**: Обновить пользовательскую метку счета или день подачи показаний.
  - **Тело запроса**: `{"customLabel": "Свет (Iberdrola)", "meterSubmissionDay": 20}`

- **`DELETE /accountant/accounts/:id`**
  - **Описание**: Удаление счета.

---

### 3.5. Начисления и квитанции (`/accountant/accruals`, `/accountant/invoices`)

- **`GET /accountant/accruals`**
  - **Описание**: Список начислений коммунальных платежей с фильтрацией по счету или периоду.

- **`GET /accountant/invoices`**
  - **Описание**: Список квитанций с прикрепленными PDF файлами в S3 хранилище.

- **`GET /accountant/invoices/upload-url?accountExternalId=...&periodLabel=...`**
  - **Описание**: Генерация URL для загрузки PDF файла квитанции. При включенном S3 возвращает предподписанный S3 PUT URL; при локальном режиме возвращает ссылку на эндпоинт `upload-raw`.
  - **Пример запроса**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/invoices/upload-url?accountExternalId=7751294&periodLabel=202609"
    ```

- **`PUT /accountant/invoices/upload-raw?key=...`**
  - **Описание**: Прием бинарного потока PDF квитанции и сохранение на локальный диск в директорию `data/uploads/`.
  - **Пример запроса**:
    ```bash
    curl -X PUT "http://accruals-accountant:3005/accountant/invoices/upload-raw?key=586194-202609.pdf" \
      -H "Content-Type: application/pdf" --data-binary @invoice.pdf
    ```

- **`GET /accountant/invoices/download/:key`**
  - **Описание**: Скачивание локально сохраненного PDF файла квитанции.
  - **Пример запроса**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/invoices/download/586194-202609.pdf" -o invoice.pdf
    ```

- **`GET /accountant/invoices/:id`**
  - **Описание**: Данные квитанции по ID.

- **`GET /accountant/invoices/by-period?accountExternalId=...&period=...`**
  - **Описание**: Поиск квитанции по внешнему ID счета и периоду (например, `2026-09`).

- **`POST /accountant/invoices`**
  - **Описание**: Ручное создание квитанции.
  - **Тело запроса**:
    ```json
    {
      "accountId": 1,
      "period": "2026-09",
      "amount": 75.50,
      "comment": "Счет за электроэнергию сентябрь"
    }
    ```

- **`DELETE /accountant/invoices/:id`**
  - **Описание**: Удаление квитанции.

---

### 3.6. Платежи арендаторов (`/accountant/payments`)

- **`GET /accountant/payments`**
  - **Описание**: Список внесенных оплат арендаторов.
  - **Query-параметры**: `status` (`pending`, `confirmed`, `rejected`), `userId`, `accountId`, `userName`.
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/payments?status=pending"
    ```

- **`POST /accountant/payments`**
  - **Описание**: Регистрация платежа арендатора.
  - **Тело запроса**:
    ```json
    {
      "tenantId": 1,
      "amount": 450,
      "comment": "Оплата аренды за октябрь",
      "status": "pending"
    }
    ```

- **`POST /accountant/payments/confirm`**
  - **Описание**: Подтверждение платежа администратором.
  - **Тело запроса**: `{"paymentId": 5, "confirmedBy": 743866013}`

- **`POST /accountant/payments/reject`**
  - **Описание**: Отклонение платежа с указанием причины.
  - **Тело запроса**: `{"paymentId": 5, "confirmedBy": 743866013, "comment": "Неверная сумма"}`

- **`DELETE /accountant/payments/:id`**
  - **Описание**: Удаление записи платежа.

---

### 3.7. Уведомления и события счетчиков (`/accountant/notifications`)

- **`GET /accountant/notifications`**
  - **Описание**: Список напоминаний о подаче показаний счетчиков и системных событий.

---

## 4. API сервиса Accruals Watcher (`accruals-watcher:4500`)

Базовый URL изнутри Docker-сети: `http://accruals-watcher:4500`

- **`GET /scraping/runs`** (или `GET /api/runs`)
  - **Описание**: Получить историю и статус последних сессий автоматического сбора квитанций с внешних порталов ЖКХ.
  - **Пример**:
    ```bash
    curl -s http://accruals-watcher:4500/scraping/runs
    ```

- **`POST /scraping/scan`**
  - **Описание**: Ручной запуск Playwright-парсера для сбора свежих начислений и скачивания PDF квитанций. При ошибках возвращает детализированный статус (`needs_login`, `warning`, `error`) с полями `error` и `errors` и фиксирует запуск в базе данных `watcher_db.runs`.
  - **Пример запроса**:
    ```bash
    curl -s -X POST http://accruals-watcher:4500/scraping/scan \
      -H "Content-Type: application/json" \
      -d '{}'
    ```
  - **Пример ответа при сбое авторизации (`status: "needs_login"`):**
    ```json
    {
      "startedAt": "2026-10-04T21:00:00.000Z",
      "finishedAt": "2026-10-04T21:00:04.000Z",
      "trigger": "manual",
      "status": "needs_login",
      "message": "Сессия авторизации истекла. Требуется ручной вход.",
      "error": "Сессия авторизации истекла. Требуется ручной вход.",
      "errors": ["Сессия авторизации истекла. Требуется ручной вход."],
      "apartmentsScanned": 0,
      "accrualsObserved": 0,
      "invoicesObserved": 0,
      "newApartments": 0,
      "newAccruals": 0,
      "newInvoices": 0,
      "needsLogin": true
    }
    ```

- **`POST /scraping/browser/start`**
  - **Описание**: Динамический запуск контейнера удаленного визуального браузера (`accruals-visual-browser`) для прохождения двухфакторной авторизации владельцем в 1 клик. Возвращает публичный URL для перехода.
  - **Пример запроса**:
    ```bash
    curl -s -X POST http://accruals-watcher:4500/scraping/browser/start
    ```
  - **Пример ответа**:
    ```json
    {
      "success": true,
      "status": "started",
      "browserUrl": "https://browser.viasglobal.es",
      "message": "Удаленный браузер успешно запущен. Перейдите по ссылке для авторизации."
    }
    ```

- **`POST /scraping/browser/stop`**
  - **Описание**: Остановка контейнера удаленного браузера после завершения ручного входа для освобождения блокировки профиля сессии Playwright.
  - **Пример запроса**:
    ```bash
    curl -s -X POST http://accruals-watcher:4500/scraping/browser/stop
    ```
  - **Пример ответа**:
    ```json
    {
      "success": true,
      "status": "stopped",
      "browserUrl": "https://browser.viasglobal.es",
      "message": "Удаленный браузер успешно остановлен, профиль сессии освобожден."
    }
    ```

- **`GET /scraping/browser/status`**
  - **Описание**: Проверка текущего состояния контейнера удаленного браузера (запущен/остановлен).
  - **Пример запроса**:
    ```bash
    curl -s http://accruals-watcher:4500/scraping/browser/status
    ```
  - **Пример ответа**:
    ```json
    {
      "isRunning": false,
      "status": "stopped",
      "browserUrl": "https://browser.viasglobal.es",
      "message": "Удаленный виртуальный браузер остановлен."
    }
    ```

---

## 5. API сервиса Backend Amazon Wholesale (`backend:3000`)

Базовый URL изнутри Docker-сети: `http://backend:3000`

### 5.1. Бренды (`/brands`)

- **`GET /brands/check?name=<brandName>`**
  - **Описание**: Проверить наличие бренда в базе данных Viasglobal.
  - **Пример**:
    ```bash
    curl -s "http://backend:3000/brands/check?name=LEGO"
    ```
  - **Ответ**:
    ```json
    { "name": "LEGO", "exists": true }
    ```

---

### 5.2. Дистрибьюторы (`/distributors`)

- **`GET /distributors`**
  - **Описание**: Список всех B2B поставщиков/дистрибьюторов.
  - **Query-параметры**: `status` (`NEW`, `CONTACTED`, `IN_PROGRESS`, `ACTIVE`, `REJECTED`).
  - **Пример**:
    ```bash
    curl -s "http://backend:3000/distributors?status=ACTIVE"
    ```

- **`GET /distributors/:id`**
  - **Описание**: Детальная информация о поставщике по ID.

- **`POST /distributors`**
  - **Описание**: Добавление нового поставщика.
  - **Тело запроса (JSON)**:
    ```json
    {
      "name": "Distributor Name",
      "website": "https://example.com",
      "email": "contact@example.com",
      "status": "NEW"
    }
    ```

- **`PATCH /distributors/:id/status`**
  - **Описание**: Изменение статуса поставщика в воронке коммуникации.
  - **Тело запроса**:
    ```json
    {
      "status": "CONTACTED",
      "notes": "Отправлен запрос каталога",
      "email": "sales@distributor.com"
    }
    ```

---

### 5.3. Приватные лейблы (`/private-labels`)

- **`GET /private-labels/check?brandName=...&sellerId=...`**
  - **Описание**: Проверка связки Бренд + Продавец на признак Private Label.
  - **Пример**:
    ```bash
    curl -s "http://backend:3000/private-labels/check?brandName=Nike&sellerId=A1234567"
    ```

- **`POST /private-labels`**
  - **Описание**: Сохранение проверенной связки Private Label в базу данных.
  - **Тело запроса**:
    ```json
    {
      "brandName": "NIKE",
      "sellerId": "A1234567",
      "sellerName": "Nike Official Store"
    }
    ```

---

### 5.4. Keepa и товарные очереди (`/keepa`)

- **`GET /keepa/allowed-categories`**
  - **Описание**: Получить белый список безопасных оптовых категорий Amazon.
  - **Пример**:
    ```bash
    curl -s http://backend:3000/keepa/allowed-categories
    ```

- **`POST /keepa/enqueue/:asin`**
  - **Описание**: Экстренная постановка товара (ASIN) в очередь Keepa с наивысшим приоритетом CRITICAL и немедленным возвратом чистовых обработанных данных.
  - **Пример**:
    ```bash
    curl -s -X POST "http://backend:3000/keepa/enqueue/B00000JDFT"
    ```

- **`POST /keepa/populate-queue`**
  - **Описание**: Наполнение очереди парсинга кандидатов из CandidatesProductsView.

- **`POST /keepa/export/brand/:brandId?name=<brandName>`**
  - **Описание**: Запуск сбора всех товаров указанного бренда через Keepa Product Finder.

- **`POST /keepa/export/seller/:sellerId`**
  - **Описание**: Запуск сбора товаров с витрины указанного продавца Amazon.

- **`POST /keepa/export/category/:categoryId`**
  - **Описание**: Запуск сбора товаров по ID категории.

---

### 5.5. Анализ товаров (`/analysis`)

- **`POST /analysis/process-queue`**
  - **Описание**: Асинхронный запуск фоновой обработки очереди юнит-экономики и оптового анализа товаров.
  - **Пример**:
    ```bash
    curl -s -X POST http://backend:3000/analysis/process-queue
    ```

---

## 6. Правила использования для AI-ассистентов (OpenClaw, Hermes)

1. **Доступ через Bash и cURL**:
   - При выполнении запросов к микросервисам используй команду `curl -s` с передачей правильных заголовков `Content-Type: application/json`.
   - Для парсинга ответов используй утилиту `jq` или встроенные средства JavaScript.
2. **КАТЕГОРИЧЕСКИЙ ЗАПРЕТ НА САМОСТОЯТЕЛЬНЫЕ ИЗМЕНЕНИЯ И МУТАЦИИ**:
   - Агентам **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО** самостоятельно отправлять запросы создания, изменения или удаления данных (`POST`, `PUT`, `PATCH`, `DELETE`) без предварительного явного подтверждения пользователя.
   - **Обязательный регламент согласования**:
     1. Сначала уточнить у пользователя всю недостающую информацию и обязательные поля.
     2. Выслать пользователю наглядное сообщение с проектом операции: какую конкретно сущность он будет создавать (с перечислением всех полей и значений), как именно изменит существующую запись или что конкретно будет удалено/отклонено.
     3. Выполнять фактический HTTP-запрос ТОЛЬКО после явного прямого подтверждения пользователем этого плана. Без согласия запрос не отправляется!
3. **Безопасность данных**:
   - Операции чтения (`GET`) безопасны и выполняются свободно для получения актуального статуса.
4. **Обработка ошибок**:
   - Если сервис возвращает код `404` или `500`, обязательно возвращай пользователю текст ошибки из тела ответа JSON.

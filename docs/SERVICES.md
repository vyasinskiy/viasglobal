# Реестр микросервисов и API эндпоинтов Viasglobal

В данном документе описана архитектура локальной инфраструктуры кластера Viasglobal, перечень запущенных Docker-контейнеров, сетевые связки и спецификация всех доступных внутренних HTTP REST эндпоинтов.

> [!IMPORTANT]
> Данный файл является единым источником правды для AI-агентов (OpenClaw, Hermes) и разработчиков.
> Управление микросервисами может осуществляться по HTTP с помощью автономных ИИ-агентов.
> **Критическое требование**: любые эндпоинты обязаны всегда возвращать полный структурированный ответ (`status`, `message`, `error`, `errors`, сводные счетчики) для качественной диагностики без необходимости чтения сырых логов.
> При добавлении, изменении или удалении сервисов, портов или эндпоинтов в репозитории **обязательно** синхронно обновлять этот документ.
> **Обязательный деплой OpenClaw**: после любого изменения `docs/SERVICES.md` **всегда** необходимо запускать `make redeploy-openclaw`, так как OpenClaw является связующим звеном между сервисами и при деплое копирует этот файл в свое рабочее окружение (`data/workspace/SERVICES.md`).

---

## 1. Топология сетей Docker

Все микросервисы объединены в две основные изолированные bridge-сети Docker на сервере:

1. **`infra_accruals-network`**: Общая сервисная сеть (`rent`, `ecommerce`, AI-агенты, SMS Gateway).
   - Контейнеры: `accruals-accountant`, `accruals-watcher`, `accruals-telegram-bot`, `accruals-rabbitmq`, `accruals-postgres`, `accruals-admin-ui`, `viasglobal-openclaw`, `viasglobal-hermes`, `ecommerce-backend`, `ecommerce-admin`, `sms-gateway`.
2. **`backend_default`**: Сеть основного бэкенда каталога Wholesale и парсинга Keepa (`backend`).
   - Контейнеры: `backend`, `viasglobal-openclaw`, `viasglobal-hermes`, `sms-gateway`.

AI-ассистенты `viasglobal-openclaw` и `viasglobal-hermes` подключены к **обеим сетям**, поэтому могут обращаться к любому сервису по его прямому Docker DNS-имени без выхода в публичный интернет.

---

## 2. Сводная таблица контейнеров и портов

| Сервис | Docker DNS имя | Внутренний порт | Внешний порт (хост) | Назначение |
| :--- | :--- | :--- | :--- | :--- |
| **Accountant Service** | `accruals-accountant` | `3005` | `3005` | Учет аренды, начисления, квитанции, платежи, арендаторы |
| **Watcher Service** | `accruals-watcher` | `4500` | `4500` | Парсинг коммунальных порталов через Playwright |
| **Backend API** | `backend` | `3000` | `3000` | Amazon Wholesale, бренды, дистрибьюторы, Keepa очереди |
| **Admin UI (Rent)** | `accruals-admin-ui` | `3000` | `3000` (`https://rent.viasglobal.es`) | Веб-интерфейс панели администратора аренды (Next.js/MUI) |
| **E-Commerce Backend** | `ecommerce-backend` | `3001` | `3010` | REST API CRM/ERP: товары, закупки, поставщики, остатки, заказы |
| **E-Commerce Admin UI** | `ecommerce-admin` | `3000` | `3020` (`https://crm.viasglobal.es`) | Веб-интерфейс CRM/ERP (Next.js 16/MUI) |
| **E-Commerce PostgreSQL**| `ecommerce-db` | `5432` | `5434` | База данных `ecommerce_db` |
| **RabbitMQ** | `accruals-rabbitmq` | `5672`, `15672` | `5672`, `15672` | Очередь событий и веб-консоль управления (guest/guest) |
| **PostgreSQL (Rent)** | `accruals-postgres` | `5432` | `5432` | Базы данных `accountant_db`, `watcher_db`, `telegram_bot_db` |
| **Telegram Bot Rent** | `accruals-telegram-bot`| - | - | Бот арендаторов и администраторов аренды |
| **Visual Browser** | `accruals-visual-browser` | `3000` | `3002` (`https://browser.viasglobal.es`) | Удаленный визуальный Chromium с веб-доступом (KasmVNC) для авторизации по SMS/паролю |
| **Hermes Agent** | `viasglobal-hermes` | - | - | Голосовой AI-ассистент с локальным STT Whisper |
| **OpenClaw Agent** | `viasglobal-openclaw` | `18789` | `18789` | Автономный AI-ассистент в Telegram |
| **Viaslangs Service** | `viaslangs-web` / `localhost` | `3000` | `3000` (`https://langs.viasglobal.es`) | Тренажер испанского/английского, сессии, клики Next, ошибки по тегам и формам |
| **SMS Gateway** | `sms-gateway` | `3040` | `3040` | Прием SMS с USB-телефона Meizu, Telegram-форвардер, health check, REST API |

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
  - **Описание**: Обновить пользовательскую метку счета (`customLabel`).
  - **Тело запроса**: `{"customLabel": "Свет (Iberdrola)"}`

- **`DELETE /accountant/accounts/:id`**
  - **Описание**: Удаление счета.

---

### 3.5. Начисления и квитанции (`/accountant/accruals`, `/accountant/invoices`)

- **`GET /accountant/accruals`**
  - **Описание**: Список начислений коммунальных платежей с фильтрацией по счету или периоду.

- **`GET /accountant/invoices`**
  - **Описание**: Список квитанций с прикрепленными PDF файлами в локальном хранилище.

- **`GET /accountant/invoices/upload-url?accountExternalId=...&periodLabel=...`**
  - **Описание**: Генерация URL для загрузки PDF файла квитанции в локальное хранилище микросервиса `accountant` (ссылка на эндпоинт `upload-raw`).
  - **Пример запроса**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/invoices/upload-url?accountExternalId=7751294&periodLabel=202609"
    ```

- **`PUT /accountant/invoices/upload-raw?key=...[&overwrite=true]`**
  - **Описание**: Прием бинарного потока файла (квитанции или чека) и сохранение на локальный диск в директорию `data/uploads/`.
  - **Защита от перезаписи**: По умолчанию, если файл с таким именем уже существует, сервер возвращает статус `409 Conflict`. Для принудительной перезаписи необходимо явно передавать query-параметр `overwrite=true`.
  - **Пример запроса**:
    ```bash
    curl -X PUT "http://accruals-accountant:3005/accountant/invoices/upload-raw?key=586194-202609.pdf" \
      -H "Content-Type: application/pdf" --data-binary @invoice.pdf
    ```

- **`GET /accountant/invoices/download/:key`** (а также вложенные пути `download/*path`)
  - **Описание**: Скачивание локально сохраненного PDF файла квитанции.
  - **Валидация**: Ключ обязан быть валидным путем. Пустые значения, пробелы или плейсхолдеры (`***`, `...`) отклоняются со статусом `400 Bad Request`.
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
  - **Описание**: Список внесенных оплат арендаторов с обогащенными ссылками на чеки (`receiptUrl`).
  - **Query-параметры**: `status` (`pending`, `confirmed`, `rejected`), `userId`, `accountId`, `userName`.
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/payments?status=pending"
    ```

- **`GET /accountant/payments/:id`**
  - **Описание**: Получить полную информацию по конкретному платежу (включая `receiptPhotoId`, актуальный `receiptUrl` для просмотра/скачивания, данные банка, пользователя и арендатора).
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/payments/5"
    ```

- **`POST /accountant/payments`**
  - **Описание**: Регистрация платежа арендатора. Поддерживает передачу файла чека в `receiptPhotoId` (Data URI Base64, Telegram `file_id`, URL или готовый ключ), а также в явных полях `dataUri`, `receiptUrl` или `fileBufferBase64`. При передаче Data URI или URL файл автоматически скачивается/декодируется и сохраняется в локальное хранилище под стандартным ключом `payments/{paymentId}/receipts/...`, а в поле `receiptPhotoId` в базе данных фиксируется этот ключ (сырой Base64 в базу не попадает). Автоматически определяет формат PDF по сигнатуре `%PDF-`. Лимит тела запроса составляет до 50 МБ.
  - **Тело запроса**:
    ```json
    {
      "tenantId": 1,
      "amount": 15000,
      "comment": "Оплата аренды. Внесение наличных через банкомат Т-Банка 22.08.2026 15:59 МСК. Дата определена по чеку банкомата.",
      "status": "pending",
      "paymentDate": "2026-08-22T12:59:30.000Z",
      "bankId": 2,
      "receiptPhotoId": "data:application/pdf;base64,JVBERi0xLjU..."
    }
    ```
  - **Поддерживаемые параметры**:
    - `tenantId` (число): ID арендатора (либо `userId`).
    - `amount` (число или строка, обязательно): сумма платежа в рублях.
    - `paymentDate` (строка ISO 8601, опционально): фактическая дата и время совершения финансовой операции (из чека, квитанции, скриншота переписки). Если платеж формируется с задержкой (спустя дни или недели после оплаты), **ОБЯЗАТЕЛЬНО передавать `paymentDate`**, чтобы дата платежа соответствовала дате реального чека, а не моменту вызова API. Если параметр не указан, сервер подставляет текущее время (`new Date()`).
    - `createdAt` (строка ISO 8601, опционально, fallback): техническая дата создания записи в БД (если не указана, сервер выставляет `@default(now())`).
    - `bankId` (число, опционально): ID банка зачисления (например `2` для Тинькофф / Т-Банк, `1` для Альфа-Банк). Список доступен через `GET /accountant/banks`.
    - `comment` (строка, опционально): комментарий к платежу, реквизиты, квитанция и обоснование определения даты платежа.
    - `status` (строка, опционально): `'pending'` (по умолчанию при создании ассистентом), `'confirmed'`, `'unconfirmed'`.
    - `receiptPhotoId` (строка, опционально): Data URI, URL, ключ в хранилище или Telegram file_id.
    - `dataUri` / `fileBufferBase64` / `receiptUrl` (строка, опционально): альтернативные способы прямой передачи файла чека.

- **`PUT /accountant/payments/:id`**
  - **Описание**: Редактирование существующего платежа (сумма, статус, комментарий, банк, дата платежа `paymentDate`, чек).
  - **Тело запроса**:
    ```json
    {
      "amount": 15000,
      "status": "confirmed",
      "comment": "Сумма и дата скорректированы по чеку",
      "paymentDate": "2026-08-22T12:59:30.000Z",
      "bankId": 2
    }
    ```
  - **Поддерживаемые параметры**: `amount`, `status`, `comment`, `paymentDate` (ISO 8601 дата платежа), `createdAt` (дата создания в БД), `bankId` (ID банка), `receiptPhotoId`, `confirmedAt`.

- **`POST /accountant/payments/:id/receipt`**
  - **Описание**: Загрузка или замена чека к существующему платежу. Сохраняет файл в локальное хранилище (`payments/{paymentId}/receipts/...`), обновляет `receipt_photo_id` в базе данных и возвращает обновленный платеж и прямую ссылку `receiptUrl`. Лимит тела запроса составляет до 50 МБ. Автоматически определяет формат PDF по сигнатуре файла `%PDF-`.
  - **Тело запроса**:
    ```json
    {
      "dataUri": "data:application/pdf;base64,...",
      "fileName": "receipt.pdf",
      "mimeType": "application/pdf"
    }
    ```
    *Либо*: `{"fileBufferBase64": "...", "fileName": "receipt.pdf"}`
    *Либо*: `{"receiptUrl": "http://..."}` (сервер автоматически скачивает файл по ссылке и сохраняет в постоянное хранилище)
    *Либо*: `{"telegramFileId": "BAACAgIAAxkBA..."}` (для сохранения Telegram file_id).
    *Для прямой бинарной загрузки без Base64*: доступен эндпоинт `PUT /accountant/invoices/upload-raw?key=payments/{id}/receipts/receipt.pdf` с бинарным телом файла и последующим `PUT /accountant/payments/:id {"receiptPhotoId": "..."}`.
  - **Пример**:
    ```bash
    curl -s -X POST http://accruals-accountant:3005/accountant/payments/5/receipt \
      -H "Content-Type: application/json" \
      -d '{"dataUri":"data:application/pdf;base64,...","fileName":"check.pdf"}'
    ```

- **`DELETE /accountant/payments/:id/receipt`**
  - **Описание**: Удаление прикрепленного чека у платежа (удаляет файл из локального хранилища при наличии и сбрасывает поле `receipt_photo_id` в `null`).
  - **Пример**:
    ```bash
    curl -s -X DELETE http://accruals-accountant:3005/accountant/payments/5/receipt
    ```

- **`GET /accountant/payments/:id/receipt`**
  - **Описание**: Получение актуальной ссылки на скачивание/просмотр чека (`downloadUrl`), либо прямое скачивание / редирект. Автоматически выставляет `Content-Type: application/pdf` для PDF-документов.
  - **Query-параметры**:
    * `redirect=true` (или заголовок `Accept: text/html`): мгновенный HTTP 302 редирект на ссылку скачивания.
    * `download=true`: прямая отдача бинарного содержимого файла чека с корректным заголовком `Content-Type` (`application/pdf` или `image/jpeg`).
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/payments/1/receipt"
    # Для мгновенного скачивания файла:
    curl -s "http://accruals-accountant:3005/accountant/payments/1/receipt?download=true" -o check.pdf
    ```

- **`GET /accountant/storage/download`**
  - **Описание**: Универсальный эндпоинт скачивания любого файла (чека или квитанции) из локального хранилища `data/uploads` по ключу `key`.
  - **Query-параметры**: `key` (например `key=payments/1/receipts/check.pdf`).
  - **Валидация**: Ключ обязан быть валидным путем. Пустые значения, пробелы или плейсхолдеры (`***`, `...`) отклоняются со статусом `400 Bad Request`.
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/storage/download?key=payments/1/receipts/check.pdf" -o check.pdf
    ```

- **`GET /accountant/payments/receipt/signed-url`**
  - **Описание**: Генерация ссылки на скачивание по произвольному ключу чека в локальном хранилище.
  - **Query-параметры**: `key` (например: `key=payments/5/receipts/receipt.jpg`).

- **`POST /accountant/payments/confirm`**
  - **Описание**: Подтверждение платежа администратором.
  - **Тело запроса**: `{"paymentId": 5, "confirmedBy": 743866013}`

- **`POST /accountant/payments/reject`**
  - **Описание**: Отклонение платежа с указанием причины.
  - **Тело запроса**: `{"paymentId": 5, "confirmedBy": 743866013, "comment": "Неверная сумма"}`

- **`DELETE /accountant/payments/:id`**
  - **Описание**: Удаление записи платежа (включая автоматическую очистку прикрепленного чека из хранилища).

---

### 3.7. Справочник банков (`/accountant/banks`)

- **`GET /accountant/banks`**
  - **Описание**: Список зарегистрированных банков и количество платежей по каждому. Используется для сопоставления банка из чека с `bankId`.
  - **Пример**:
    ```bash
    curl -s "http://accruals-accountant:3005/accountant/banks"
    ```
  - **Пример ответа**:
    ```json
    [
      {"id": 1, "name": "Альфа-Банк", "createdAt": "2026-10-05T10:13:26.879Z", "_count": {"payments": 1}},
      {"id": 2, "name": "Тинькофф", "createdAt": "2026-10-05T10:13:26.879Z", "_count": {"payments": 5}}
    ]
    ```

- **`GET /accountant/banks/:id`**
  - **Описание**: Информация о банке по ID.

- **`POST /accountant/banks`**
  - **Описание**: Добавление нового банка.
  - **Тело запроса**: `{"name": "Сбербанк"}`

- **`PUT /accountant/banks/:id`**
  - **Описание**: Переименование банка.
  - **Тело запроса**: `{"name": "Т-Банк"}`

- **`DELETE /accountant/banks/:id`**
  - **Описание**: Удаление банка из справочника.

---

### 3.8. Уведомления и события счетчиков (`/accountant/notifications`)

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

- **`GET /scraping/runs/:id`**
  - **Описание**: Получить детальные результаты и полный JSON-диагностики конкретной сессии сканирования по ее ID.
  - **Пример**:
    ```bash
    curl -s http://accruals-watcher:4500/scraping/runs/16
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

## 6. API сервиса E-Commerce CRM (`ecommerce-backend:3001`)

Базовый URL изнутри Docker-сети: `http://ecommerce-backend:3001`
Базовый URL извне через веб-панель: `https://crm.viasglobal.es/api`

### 6.1. Авторизация (`/auth`)

- **`POST /auth/login`**
  - **Описание**: Вход пользователя в систему.
  - **Тело запроса (JSON)**: `{"email": "admin@viasglobal.com", "password": "..."}`
  - **Ответ**: `{ "access_token": "...", "user": { "id": 1, "email": "...", "name": "...", "role": "ADMIN" } }`

- **`POST /auth/register`**
  - **Описание**: Регистрация нового менеджера/администратора.
  - **Тело запроса (JSON)**: `{"email": "user@example.com", "password": "...", "name": "Имя"}`

---

### 6.2. Поставщики (`/suppliers`)

- **`GET /suppliers`**
  - **Описание**: Список всех поставщиков CRM.
  - **Query-параметры**: `status` (`NEW`, `RESEARCHING`, `FORM_SUBMITTED`, `EMAIL_SENT`, `CALLED`, `NEGOTIATING`, `ACCOUNT_OPENED`, `REJECTED`, `INACTIVE`).
  - **Пример**: `curl -s "http://ecommerce-backend:3001/suppliers?status=ACCOUNT_OPENED"`

- **`POST /suppliers`**
  - **Описание**: Добавление нового поставщика в воронку.
  - **Тело запроса**: `{"name": "Поставщик", "website": "https://...", "country": "ES", "email": "info@...", "phone": "..."}`

- **`GET /suppliers/funnel`**
  - **Описание**: Сводная статистика воронки работы с поставщиками по статусам.

- **`GET /suppliers/:id`**
  - **Описание**: Полная карточка поставщика с контактами, историей коммуникаций и привязанными товарами.

- **`PATCH /suppliers/:id/status`**
  - **Описание**: Смена этапа воронки поставщика.
  - **Тело запроса**: `{"status": "NEGOTIATING", "notes": "Получен оптовый прайс-лист"}`

- **`POST /suppliers/:id/contacts`**
  - **Описание**: Добавление контактного лица к поставщику (`name`, `role`, `email`, `phone`, `isPrimary`).

- **`POST /suppliers/:id/communications`**
  - **Описание**: Фиксация факта коммуникации (`type`: `CALL`/`EMAIL`/`MEETING`/`FORM`, `notes`, `nextContactDate`).

- **`DELETE /suppliers/:id`**
  - **Описание**: Удаление поставщика.

---

### 6.3. Каталог товаров (`/products`)

- **`GET /products`**
  - **Описание**: Каталог товаров с артикулами (SKU), ценами, габаритами и остатками.

- **`POST /products`**
  - **Описание**: Создание товара.
  - **Тело запроса**: `{"sku": "PROD-001", "name": "Наименование", "costPrice": 12.5, "retailPrice": 29.99, "weight": 0.35}`

- **`GET /products/:id`**
  - **Описание**: Детальная информация о товаре, привязанных платформах (ASIN Amazon, Etsy ID) и поставщиках.

- **`PATCH /products/:id`**
  - **Описание**: Обновление характеристик или цен товара.

- **`DELETE /products/:id`**
  - **Описание**: Удаление товара из каталога.

- **`POST /products/:id/external-ids`**
  - **Описание**: Привязка внешнего ID платформы (Amazon ASIN, Etsy ID).

---

### 6.4. Закупки у поставщиков (`/purchases`)

- **`GET /purchases`**
  - **Описание**: Список заказов на закупку. Фильтр: `?status=CONFIRMED`.
  - **Статусы**: `DRAFT`, `SENT`, `CONFIRMED`, `PAID`, `SHIPPED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`.

- **`POST /purchases`**
  - **Описание**: Создание заказа на закупку с перечнем позиций и закупочными ценами.

- **`GET /purchases/:id`**
  - **Описание**: Детальный заказ закупки со строками и статусом поставки.

- **`PATCH /purchases/:id/status`**
  - **Описание**: Смена статуса закупки. При переводе в `RECEIVED` автоматически приходуются остатки на склад.

- **`DELETE /purchases/:id`**
  - **Описание**: Отмена заказа на закупку.

---

### 6.5. Заказы и продажи (`/sales`)

- **`GET /sales`**
  - **Описание**: Список заказов покупателей с маркетплейсов.

- **`POST /sales`**
  - **Описание**: Регистрация заказа продажи (платформа, номер заказа, состав, комиссия площадки).

- **`GET /sales/:id`**
  - **Описание**: Детали заказа продажи с расчетом себестоимости и чистой прибыли.

- **`PATCH /sales/:id/status`**
  - **Описание**: Обновление статуса заказа (`PENDING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). При отправке автоматически списываются остатки со склада.

---

### 6.6. Складской учет и остатки (`/inventory`)

- **`GET /inventory`**
  - **Описание**: Текущие складские остатки по складам (`OWN`, `FBA`, `THIRD_PARTY`).

- **`GET /inventory/movements`**
  - **Описание**: Журнал движений товаров (приход, списание, резерв, возврат).

- **`POST /inventory/movements`**
  - **Описание**: Ручное создание складского движения (инвентаризация, списание, корректировка).

- **`GET /inventory/low-stock`**
  - **Описание**: Список товаров с остатком ниже минимального страхового порога.

---

### 6.7. Документооборот (`/documents`)

- **`POST /documents/upload`**
  - **Описание**: Загрузка файла (PDF, скан, инвойс, накладная) с привязкой к сущности (`SUPPLIER`, `PURCHASE`, `SALE`, `PRODUCT`).
  - **Формат**: `multipart/form-data` (файл в поле `file`, метаданные в теле).

- **`GET /documents/:entityType/:entityId`**
  - **Описание**: Список прикрепленных документов для выбранной сущности.

- **`GET /documents/:id/download`**
  - **Описание**: Скачивание файла документа по ID.

- **`DELETE /documents/:id`**
  - **Описание**: Удаление документа из системы и дискового хранилища.

---

### 6.8. Аналитика и маржинальность (`/analytics`)

- **`GET /analytics/kpis`**
  - **Описание**: Ключевые метрики бизнеса (выручка, маржа, чистая прибыль, средний чек).

- **`GET /analytics/sales-by-platform`**
  - **Описание**: Распределение продаж и комиссий по площадкам (Amazon vs Etsy).

- **`GET /analytics/top-products`**
  - **Описание**: Рейтинг наиболее маржинальных и популярных товаров.

- **`GET /analytics/margin-analysis`**
  - **Описание**: Построчный расчет прибыльности и удержаний комиссий.

---

## 7. API сервиса Viaslangs — Тренажер испанского и аналитика сессий (`viaslangs-web:3000`)

Базовый URL: `http://localhost:3000` (локально) или `https://langs.viasglobal.es`
Авторизация для AI-агентов: Заголовок `x-app-password: viasglobal` или `Authorization: Bearer viasglobal`.

### 7.1. Фиксация активности в сессионном дне (`POST /api/sessions/activity`)

- **Описание**: Фиксирует активность пользователя в рамках текущего дня (нажатие кнопки `Next`, успешный ответ или ошибку). Если на сегодня сессия еще не открыта, она создается автоматически.
- **Тело запроса (JSON)**:
  ```json
  {
    "languageId": 2,
    "wordId": 80,
    "activityType": "NEXT",
    "userAnswer": "abono"
  }
  ```
- **Параметры**:
  * `languageId` (число, опционально): ID языка (по умолчанию `2` - испанский `es`).
  * `wordId` (число, опционально): ID карточки слова, на которой произошло действие.
  * `activityType` (строка, обязательно): `'NEXT'` (клик на кнопку Next / прочитан пример), `'ANSWER_CORRECT'` (верный ответ), `'ANSWER_ERROR'` (ошибка).
  * `userAnswer` (строка, опционально): введенный пользователем ответ.
- **Пример запроса**:
  ```bash
  curl -s -X POST http://localhost:3000/api/sessions/activity \
    -H "Content-Type: application/json" \
    -H "x-app-password: viasglobal" \
    -d '{"activityType":"NEXT","wordId":80}'
  ```

---

### 7.2. Статистика по текущей сессии за сегодня (`GET /api/sessions/today`)

- **Описание**: Возвращает полную аналитику сегодняшней сессии изучения: число кликов Next (прочитанные примеры), количество верных ответов и ошибок, группировку ошибок по тегам (времена глаголов), по грамматическим лицам (`yo`, `tú`, `él/ella/usted`, `nosotros`, `vosotros`, `ellos/ellas/ustedes`), список слабых слов и готовую текстовую рекомендацию для ассистента.
- **Query-параметры**: `languageId` (опционально, по умолчанию `2` для испанского).
- **Пример запроса**:
  ```bash
  curl -s -H "x-app-password: viasglobal" "http://localhost:3000/api/sessions/today"
  ```
- **Пример ответа**:
  ```json
  {
    "success": true,
    "data": {
      "sessionId": 15,
      "date": "2026-10-24",
      "languageId": 2,
      "languageCode": "es",
      "summary": {
        "totalActivities": 45,
        "nextClicks": 15,
        "correctAnswers": 20,
        "errorAnswers": 10,
        "accuracy": 67
      },
      "tagStats": [
        { "tag": "Pretérito Indefinido", "errors": 7, "correct": 5, "total": 12, "errorRate": 58 },
        { "tag": "Pretérito Imperfecto", "errors": 2, "correct": 8, "total": 10, "errorRate": 20 },
        { "tag": "Глаголы", "errors": 9, "correct": 13, "total": 22, "errorRate": 41 }
      ],
      "formStats": [
        { "person": "yo", "label": "1-е лицо ед. ч. (yo)", "errors": 4, "correct": 6 },
        { "person": "él/ella/usted", "label": "3-е лицо ед. ч. (él/ella/usted)", "errors": 3, "correct": 2 }
      ],
      "weakWords": [
        {
          "wordId": 80,
          "english": "abonó",
          "russian": "зачислил (он / Вы)",
          "tense": "Pretérito Indefinido",
          "person": "él/ella/usted",
          "personLabel": "3-е лицо ед. ч. (él/ella/usted)",
          "errorsCount": 3
        }
      ],
      "recommendation": "В текущей сессии больше всего ошибок во времени «Pretérito Indefinido» (7 ошибок, процент ошибок: 58%) и наибольшая сложность в форме «1-е лицо ед. ч. (yo)» (4 ошибок). Сделай упор на повторение именно этих карточек!"
    }
  }
  ```

---

### 7.3. Мульти-дневная динамика активности (`GET /api/sessions/history`)

- **Описание**: Анализирует историю сессий за последние N дней (по умолчанию 7). Вычисляет среднюю и **медианную дневную активность** за предыдущие 7 дней (заполняя дни отсутствия занятий нулями), сравнивает её с сегодняшним днем (`isBelowMedian`), выявляет спад темпов и формирует флаг `shouldRemind` и готовый текст напоминания для OpenClaw.
- **Query-параметры**:
  * `days` (число, опционально, по умолчанию `7`): глубина анализа в днях.
  * `languageId` (число, опционально): ID языка.
- **Пример запроса**:
  ```bash
  curl -s -H "x-app-password: viasglobal" "http://localhost:3000/api/sessions/history?days=7"
  ```
- **Пример ответа при спаде активности ниже медианной нормы**:
  ```json
  {
    "success": true,
    "data": {
      "daysCount": 7,
      "averageDailyActivities": 22.5,
      "medianDailyActivities": 20.0,
      "todayActivities": 12,
      "isBelowMedian": true,
      "shouldRemind": true,
      "trend": "DROPPING",
      "alert": "Виталий, у тебя сегодня низкая активность по испанскому: всего 12 действий при медианной норме 20 за последние 7 дней. Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!",
      "praise": null,
      "dailySessions": [
        {
          "date": "2026-10-24",
          "totalActivities": 12,
          "nextClicks": 5,
          "correctAnswers": 5,
          "errorAnswers": 2,
          "accuracy": 71
        },
        {
          "date": "2026-10-23",
          "totalActivities": 25,
          "nextClicks": 8,
          "correctAnswers": 12,
          "errorAnswers": 5,
          "accuracy": 71
        }
      ]
    }
  }
  ```

---

### 7.4. Сценарии использования для AI-ассистента (OpenClaw / Hermes)

1. **Сценарий 1: Ответ на вопрос «Какая у меня статистика по испанскому за сегодня?»**:
   - Выполни: `curl -s -H "x-app-password: viasglobal" http://localhost:3000/api/sessions/today`
   - Извлеки `summary` и `recommendation`:
     «Сегодня сделано N активностей (X кликов Next, Y верных ответов, Z ошибок). Точность: A%.»
   - Сообщи вывод из поля `recommendation` (например: «Больше всего ошибок во времени Pretérito Indefinido (7 ошибок) на форме yo. Слабое слово: abonó»).
2. **Сценарий 2: Фоновый мониторинг активности в OpenClaw (раз в 6 часов с 11:00 до 23:00 Europe/Madrid, `0 11,17,23 * * *`)**:
   - Задача `viaslangs-spanish-study-reminder` в `openclaw/config/cron/jobs.json`.
   - Запрос: `GET https://langs.viasglobal.es/api/sessions/history?days=7` с заголовком `x-app-password: viasglobal`.
   - Критерий срабатывания: `isBelowMedian === true` или `shouldRemind === true` (дневная активность сегодня ниже медианы за последние 7 дней).
   - Если условие выполнено: бот отправляет мотивирующее напоминание пользователю в Telegram (`743866013`) без длинных тире:
     «Виталий, у тебя сегодня низкая активность по испанскому: всего [N] действий при медианной норме [M] за последние 7 дней. Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем! Открой тренажер на 10-15 минут: https://langs.viasglobal.es»
   - Если дневная активность на уровне или выше нормы (`todayActivities >= medianDailyActivities`): бот обязательно хвалит пользователя за усердие и поддержание отличного темпа («Виталий, отличная работа! Твоя дневная активность сегодня на высоте: уже [N] действий при медианной норме [M] за последние 7 дней. Так держать, регулярность - залог успеха!»). Без длинных тире.
3. **Сценарий 3: Запрос пользователя в диалоге: «Дай статистику за месяц / 30 дней (или 14 дней, N дней)»**:
   - Выполни: `curl -s -H "x-app-password: viasglobal" "https://langs.viasglobal.es/api/sessions/history?days=30"`
   - Проанализируй данные:
     * Период: `daysCount` (30 дней).
     * Текущая активность за сегодня: `todayActivities`.
     * Медианная норма за период: `medianDailyActivities`.
     * Средняя норма за период: `averageDailyActivities`.
     * Количество активных дней с занятиями (`totalActivities > 0`).
     * Тренд: `trend`.
   - Сформируй структурированный отчет в Telegram со статистикой, подведением итогов и мотивирующей рекомендацией.

---

## 8. API сервиса SMS Gateway (`sms-gateway:3040`)

Базовый URL изнутри Docker-сети: `http://sms-gateway:3040`
Базовый URL на хосте: `http://localhost:3040` или `http://100.92.50.18:3040`

Сервис обеспечивает чтение входящих SMS с мобильного телефона Meizu U20, постоянно подключенного по USB к серверу Huawei. Телефон принимает SMS от банковских терминалов самообслуживания (CaixaBank, BBVA, Santander), через которые арендаторы вносят оплату наличными. Сервис форвардит новые SMS владельцу в Telegram (`743866013`), непрерывно отслеживает здоровье устройства (заряд батареи, питание USB, SIM-карту) и предоставляет REST API для OpenClaw.

### 8.1. Комплексная проверка здоровья (`GET /health`)

- **Описание**: Проверка статуса USB-подключения телефона, уровня заряда батареи, статуса зарядки, SIM-карты и счетчика принятых SMS.
- **Пример запроса**:
  ```bash
  curl -s http://sms-gateway:3040/health
  ```
- **Пример ответа (200 OK при нормальной работе)**:
  ```json
  {
    "status": "ok",
    "message": "SMS Gateway и мобильный телефон функционируют в штатном режиме",
    "service": "sms-gateway",
    "uptimeSeconds": 14200,
    "device": {
      "connected": true,
      "serial": "U20AVCPM22MQH",
      "model": "Meizu U20",
      "manufacturer": "Meizu",
      "androidVersion": "6.0",
      "state": "device",
      "battery": {
        "level": 87,
        "isCharging": true,
        "temperature": 28.5,
        "voltage": 4150,
        "usbPowered": true
      },
      "sim": {
        "state": "READY",
        "operator": "DIGI mobil",
        "isReady": true
      }
    },
    "stats": {
      "totalSmsReceived": 14,
      "lastSmsTimestamp": 1730005000000
    },
    "lastCheckedAt": 1730005060000
  }
  ```

---

### 8.2. Получение последнего SMS (`GET /sms/latest`)

- **Описание**: Возвращает самое свежее входящее SMS сообщение. Используется OpenClaw для оперативной проверки кодов подтверждения и квитанций терминалов при сообщениях от арендаторов.
- **Пример запроса**:
  ```bash
  curl -s http://sms-gateway:3040/sms/latest
  ```
- **Пример ответа (200 OK)**:
  ```json
  {
    "status": "ok",
    "message": "Последнее входящее SMS успешно получено",
    "data": {
      "id": 14,
      "androidId": "1042",
      "sender": "CaixaBank",
      "body": "Operacion terminal 450,00 EUR completada. Codigo autorizacion: 948271",
      "receivedAt": 1730005000000,
      "telegramSentAt": 1730005001200,
      "telegramMessageId": 78912,
      "createdAt": 1730005001000
    }
  }
  ```
- **Пример ответа при отсутствии SMS (404 Not Found)**:
  ```json
  {
    "status": "error",
    "message": "В базе данных пока нет входящих SMS сообщений",
    "data": null
  }
  ```

---

### 8.3. Список входящих SMS (`GET /sms/list`)

- **Описание**: Получение истории SMS с пагинацией и гибкой фильтрацией.
- **Query-параметры**:
  - `limit` (число, по умолчанию `20`, максимум `100`): размер выборки.
  - `offset` (число, по умолчанию `0`): смещение.
  - `sender` (строка, опционально): фильтрация по номеру или имени отправителя (подстрока, например `Caixa`).
  - `search` (строка, опционально): поиск по тексту сообщения.
  - `since` (число, опционально): фильтр по времени `received_at >= since` (Unix ms).
- **Пример запроса**:
  ```bash
  curl -s "http://sms-gateway:3040/sms/list?limit=10&sender=Caixa"
  ```
- **Пример ответа**:
  ```json
  {
    "status": "ok",
    "message": "Найдено 2 из 2 сообщений",
    "data": {
      "items": [
        {
          "id": 14,
          "androidId": "1042",
          "sender": "CaixaBank",
          "body": "Operacion terminal 450,00 EUR completada. Codigo autorizacion: 948271",
          "receivedAt": 1730005000000,
          "telegramSentAt": 1730005001200,
          "telegramMessageId": 78912,
          "createdAt": 1730005001000
        }
      ],
      "pagination": {
        "total": 2,
        "limit": 10,
        "offset": 0,
        "hasMore": false
      }
    }
  }
  ```

---

### 8.4. Получение конкретного SMS по ID (`GET /sms/:id`)

- **Описание**: Детальные данные конкретного SMS сообщения по числовому первичному ключу.
- **Пример запроса**:
  ```bash
  curl -s http://sms-gateway:3040/sms/14
  ```

---

### 8.5. Принудительная синхронизация с телефоном (`POST /sms/sync`)

- **Описание**: Инициирует немедленный опрос базы Android через ADB без ожидания 5-секундного интервала поллинга.
- **Пример запроса**:
  ```bash
  curl -s -X POST http://sms-gateway:3040/sms/sync
  ```
- **Пример ответа**:
  ```json
  {
    "status": "ok",
    "message": "Синхронизация завершена. Прочитано: 30, новых сообщений: 1",
    "data": {
      "fetched": 30,
      "newCount": 1,
      "newMessages": [
        {
          "id": 15,
          "sender": "BBVA",
          "body": "Su ingreso de 500 EUR ha sido procesado",
          "receivedAt": 1730006000000
        }
      ]
    }
  }
  ```

---

### 8.6. Сценарии использования для AI-ассистента (OpenClaw / Hermes)

1. **Сценарий 1: Арендатор пишет «Я только что внес деньги через терминал, проверьте»**:
   - Шаг 1: OpenClaw вызывает принудительную синхронизацию:
     `curl -s -X POST http://sms-gateway:3040/sms/sync`
   - Шаг 2: OpenClaw запрашивает последнее SMS:
     `curl -s http://sms-gateway:3040/sms/latest`
   - Шаг 3: Агент извлекает сумму операции (например, `450,00 EUR`), код авторизации и время, сверяет с ожидаемой суммой начисления арендатора (`accruals-accountant:3005`) и сообщает владельцу и арендатору результат.
2. **Сценарий 2: Вопрос пользователя «Работает ли телефон для SMS?» / «Какой заряд у телефона?»**:
   - OpenClaw вызывает `curl -s http://sms-gateway:3040/health`
   - Анализирует статус:
     - Если `device.connected === true`: «Телефон Meizu U20 на связи по USB, батарея X% (заряжается), SIM-карта Y активна, принято Z сообщений.»
     - Если `device.connected === false`: «Внимание: телефон Meizu U20 отключен от USB или не авторизован в ADB! Проверьте физическое подключение кабеля к серверу.»

---

## 9. Паттерны проектирования API для автономных LLM-агентов (Anti-Hallucination Design Patterns)

При взаимодействии автономных языковых моделей (OpenClaw, Hermes, Antigravity) с бэкенд-сервисами критически важно предотвращать когнитивные искажения (галлюцинации) агентов. Если API возвращает неточный статус или неполную ошибку, LLM делает ложные выводы о состоянии системы и начинает деструктивные действия (создание фиктивных сущностей, попытки обхода проверок, удаление записей).

Ниже приведены обязательные паттерны проектирования API для всех микросервисов Viasglobal.

### Паттерн 1: Обязательная ранняя валидация и Fail-Fast Bad Request (HTTP 400)

- **Проблема**:
  Когда LLM генерирует запрос с плейсхолдером (например, `***`, `...`, `<key>`, `[id]`, `undefined`, пустая строка), а сервер без валидации обращается к базе данных или файловой системе и возвращает `404 Not Found` (например: `"Файл *** не найден на диске"`), LLM галлюцинирует, что:
  1. Файл действительно существовал, но пропал или был стерт.
  2. Хранилище настроено неверно или смотрит в другую директорию.
  3. Нужно обойти ограничение или создать временную сущность для манипуляции с хранилищем.
  Если же сервер падает с `TypeError` (`500 Internal Server Error`), агент заключает, что упала вся инфраструктура бэкенда.

- **Правило реализации**:
  Все контроллеры и эндпоинты **обязаны в первую очередь реализовывать Fail-Fast валидацию (HTTP 400 Bad Request)** ДО выполнения любых запросов к БД или файловым операциям:
  1. **Детекция плейсхолдеров и заглушек**: если входной параметр содержит символы шаблонов (`***`, `...`, `<...>`, `[key]`, `undefined`, `null`) или состоит только из пробелов, сервер обязан немедленно прервать выполнение и выбросить `BadRequestException` (HTTP 400).
  2. **Понятное структурированное сообщение об ошибке на русском языке**:
     Ответ должен явно указывать, что ошибка находится на стороне параметров вызывающего агента, а не на сервере, и содержать подсказку с ожидаемым форматом (`hint`):
     ```json
     {
       "statusCode": 400,
       "error": "Bad Request",
       "message": "Параметр key содержит недопустимый плейсхолдер '***' или пустое значение",
       "hint": "Укажите реальный ключ файла без маскирования, например: 464655-202605.pdf или payments/123/receipt.pdf"
     }
     ```
  3. **Результат для агента**: Получив статус `400 Bad Request`, LLM четко понимает: сервер в порядке, ошибка в ее собственном запросе. Агент исправляет аргументы вызова вместо выдумывания сбоев инфраструктуры.

### Паттерн 2: Строгое семантическое разделение кодов состояния (Semantic Status Separation)

Каждый HTTP-статус должен нести однозначный сигнал для языковой модели:
- **`400 Bad Request`**: Синтаксическая ошибка в параметрах запроса, недопустимый формат, передан плейсхолдер или пустая строка. Сигнал агенту: "Исправь параметры своего вызова".
- **`404 Not Found`**: Формат запроса корректен, но запрашиваемой сущности объективно нет в системе. Сигнал агенту: "Сущность не найдена в базе, проверь правильность ID или создай ее по регламенту".
- **`409 Conflict`**: Защита от конфликта состояний и перезаписи (например, файл или запись уже существует). Сигнал агенту: "Сущность уже существует. Перезапись запрещена без явного флага `overwrite=true`".
- **`422 Unprocessable Entity`**: Синтаксис параметров верен, но нарушены бизнес-правила (например, дата платежа в будущем или отрицательная сумма). Сигнал агенту: "Скорректируй бизнес-параметры операции".
- **`500 Internal Server Error`**: Настоящий внутренний сбой бэкенда. Любые ошибки пользовательского ввода категорически запрещено маскировать под 500 статус.

### Паттерн 3: Type Guarding и устойчивость к веб-фреймворкам (Defensive Route Guarding)

- **Особенность фреймворков**: Роутеры Express и NestJS при обработке wildcard-параметров (например, `@Get('invoices/download/*path')`) могут передавать параметр как массив строк `['folder', 'file.pdf']` вместо обычной строки.
- **Правило**:
  Все контроллеры обязаны иметь явные Type Guards (`typeof key === 'string' ? ... : Array.isArray(key) ? key.join('/') : ...`), очищать параметры от лишних слэшей и пробелов и никогда не передавать нестроковые типы в функции `path.join`, `fs` или SQL-запросы. Это полностью исключает `TypeError [ERR_INVALID_ARG_TYPE]` и защищает сервер от падения в 500 ошибку.

### Паттерн 4: Самоописывающийся диагностический конверт (Rich Diagnostic Envelope)

- Запрещены пустые ответы `{}` или фиктивные статусы `200 OK` с `{ "ok": true }` при наличии сбоя.
- Все эндпоинты процессов обязаны возвращать:
  * `status`: четкий статус (`success`, `warning`, `needs_login`, `error`, `failed`).
  * `message`: текстовое резюме результата на русском языке.
  * `error`: текст ошибки или исключения при сбое.
  * `errors`: массив частных ошибок при пакетной обработке.
  * `counts`: метрики (обработано, добавлено, пропущено, упало).

### Паттерн 5: Нулевая толерантность к выдуманным полям (Zero Parameter Invention)

- Все DTO обязаны валидироваться с флагами `whitelist: true` и `forbidNonWhitelisted: true`.
- Если LLM пытается передать выдуманное поле (например, `forceScan`, `autoRetry`), бэкенд немедленно отклоняет запрос со статусом `400 Bad Request` и списком недопустимых полей.

### Паттерн 6: Защитный контур опасных операций (Mutation Guardrails)

- Запрет неявных мутаций. Опасные действия (перезапись файлов, сброс состояний, массовое удаление) требуют обязательного явного флага (например, `?overwrite=true`).
- Агент обязан согласовывать любую мутацию с человеком перед отправкой HTTP-запроса.

---

## 10. Правила использования для AI-ассистентов (OpenClaw, Hermes)

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
4. **Обработка ошибок и статусов ответа**:
   - **Статус `400 Bad Request`**: Ошибка находится в переданных аргументах или параметрах запроса. Агент обязан прочитать поле `message` и `hint`, исправить параметры и повторить запрос с корректными данными. Категорически запрещено считать сервер сломанным или придумывать сбои в файловой системе.
   - **Запрет плейсхолдеров**: Категорически запрещено передавать в запросы маскированные значения и плейсхолдеры (`***`, `...`, `<id>`). Всегда передавай точные значения или предварительно запрашивай их через GET-списки.
   - **Запрет деструктивных обходных путей**: Если запрос вернул ошибку, запрещено пытаться обойти ее созданием фиктивных записей в других таблицах или методами path-traversal. Сообщи пользователю точный текст ошибки.
   - **Статусы `404` и `500`**: Если сервис возвращает код `404` или `500`, обязательно возвращай пользователю текст ошибки из тела ответа JSON.

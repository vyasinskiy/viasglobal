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

## 6. Паттерны проектирования API для автономных LLM-агентов (Anti-Hallucination Design Patterns)

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

## 7. Правила использования для AI-ассистентов (OpenClaw, Hermes)

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

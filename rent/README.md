# Accruals Management System

A microservices-based monorepo for managing utility accruals, tenant payments, and automated invoice tracking.

## Architecture Overview

The system consists of three main services communicating via RabbitMQ:

1.  **Accountant Service (`apps/accountant`)**:
    *   The core backend handling business logic and data persistence.
    *   Manages users, tenants, apartments, accounts, and accruals.
    *   Integrates with Prisma ORM and PostgreSQL.
    *   Handles S3 integration for storing payment receipts and invoices.

2.  **Telegram Bot Service (`apps/telegram-bot`)**:
    *   Telegram Bot interface for tenants and administrators.
    *   **Tenants**: Registration, payment submission (with photo receipts), debt status, and invoice viewing.
    *   **Admins**: User management (approval/deletion), payment confirmation, and apartment linking.
    *   **Financial AI Assistant**: Automatic parsing of voice notes, text messages, and receipt photos from the owner using Whisper (STT) and DeepSeek-V3 (LLM) to extract tenant, apartment, bank, and split rent/utility payments with interactive confirmation. See [docs/ai-financial-assistant.md](file:///Users/usuario/code/viasglobal/rent/docs/ai-financial-assistant.md).

3.  **Watcher Service (`apps/watcher`)**:
    *   Automated scraper built with Playwright.
    *   Monitors external utility provider portals to fetch the latest accrual data and download invoice PDFs.
    *   Synchronizes data back to the Accountant service.

## Tech Stack

*   **Language**: TypeScript
*   **Backend Framework**: [NestJS](https://nestjs.com/)
*   **Database**: PostgreSQL with [Prisma](https://www.prisma.io/)
*   **Message Broker**: RabbitMQ
*   **Bot Framework**: [Telegraf](https://telegraf.js.org/)
*   **Browser Automation**: Playwright
*   **Storage**: AWS S3 / S3-compatible storage
*   **Containerization**: Docker & Docker Compose

## Project Structure

```text
.
├── apps/
│   ├── accountant/      # Core logic, DB, API
│   ├── telegram-bot/    # Telegram bot interface
│   └── watcher/         # Scraping and data synchronization
├── infra/               # Deployment and infrastructure config (Docker, Nginx)
└── package.json         # Root workspace configuration
```

## Ports Mapping

Here is the network configuration and port assignments for all components of the system:

| Service | Container Name | Internal Port | Host Port | Public Domain / URL | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Admin UI** | `accruals-admin-ui` | 3000 | `3000` | `https://rent.viasglobal.es` | Web administration dashboard (MUI, закрыта авторизацией по паролю) |
| **Accountant Service** | `accruals-accountant` | 3005 | `3005` | Внутренний | Core HTTP REST API and microservice logic |
| **Watcher Service** | `accruals-watcher` | 4500 | `4500` | Внутренний | Playwright scraping control interface |
| **RabbitMQ** | `accruals-rabbitmq` | 5672, 15672 | `5672`, `15672` | Внутренний | AMQP broker & Management Console UI |
| **Visual Browser** | `accruals-visual-browser` | 3000 | `3002` | `https://browser.viasglobal.es` | Удаленный Chromium с веб-доступом (KasmVNC) для авторизации в 1 клик |
| **Telegram Bot** | `accruals-telegram-bot` | None | None | - | Long-running message daemon (no incoming TCP ports mapped) |

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   Docker & Docker Compose
*   Telegram Bot Token (from @BotFather)

### Setup

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Set up environment variables in each app's directory (copy `.env.example` to `.env`).
4.  Start the infrastructure: `docker-compose -f infra/docker-compose.yml up -d`
5.  Run database migrations: `cd apps/accountant && npx prisma migrate dev`
6.  Start services in development mode: `npm run start:dev` (from respective app directories)

## Notification Routing & Publication Flow

The system implements a strictly decoupled notification architecture. The core **Accountant Service** handles business logic and has no knowledge of Telegram-specific fields, chat IDs, or HTML formatting rules. Routing and formatting are managed entirely on the **Telegram Bot Service** side.

### Flow Architecture

```mermaid
sequenceDiagram
    participant Accountant as Accountant Service
    participant Queue as RabbitMQ Event Bus
    participant Bot as Telegram Bot Service
    database BotDB as Bot Database
    participant Telegram as Telegram API

    Accountant->>Queue: emit 'accrual_upserted' / 'invoice_available' (tenant, apartment)
    Queue->>Bot: Consume event
    rect rgb(30, 41, 59)
        Note over Bot, BotDB: Resolve target channels
        Bot->>BotDB: Query User where tenantId = tenant.id
        BotDB-->>Bot: Return telegramId (Personal Chat)
        Bot->>BotDB: Query channels where type = 'feed'
        BotDB-->>Bot: Return feed channels (or fallback config)
    end
    loop for each targetChatId
        Bot->>BotDB: Check if invoice already published to channel
        alt Not published yet
            Bot->>Telegram: Send message (HTML notification)
            Bot->>BotDB: Log record in 'publications' table
        else Already published
            Bot->>Bot: Skip to prevent duplicate spam
        end
    end
```

### Key Components

1. **Decoupled Events**: Core services emit payload events containing only logical identifiers (e.g., `tenant: { id, status }`, `apartment: { id, address }`). No platform-specific values like `chatId` or raw Telegram markup are passed.
2. **Channel Resolution**:
   * **Personal Chat**: The bot looks up the tenant's `telegramId` using the local relation mapping (`tenantId` -> `telegramId`) in the bot's database.
   * **General Feeds**: The bot queries all registered publication channels with `type = "feed"` in the `publication_channels` table (with automatic fallback to the `TELEGRAM_CHAT_ID` environment variable).
3. **Deduplication & Logs (`publications` table)**:
   * To prevent duplicate spam in channels, the bot checks the `publications` table for any pre-existing combination of `[invoiceId, channelId]`.
   * Upon successful delivery, a log record is created in `publications` to track the delivery history.

### Managing Feed Channels

Administrator can dynamically register or unregister groups/channels as publication feeds directly from Telegram:

* **Add a Feed**: Add the bot to the desired group/channel and send `/register_feed` in the group/channel chat. The bot will validate that this is not a private chat, and automatically register the chat in the `publication_channels` table with `type: "feed"`.
* **Remove a Feed**: Send `/unregister_feed` inside the registered group/channel. The bot will remove it from the list of publication feeds.

## Watcher Session Management & Troubleshooting

### Session Expiration & Detection
The Watcher service interacts with `квартплата.онлайн` using persistent browser session data and Playwright storage state (`/app/data/storage-state.json`).
* **Active Cabinet Domain**: `https://лк.квартплата.онлайн/` (`https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/`)
* **Login Domain**: `https://квартплата.онлайн/login` (`https://xn--80aaaf3bi1ahsd.xn--80asehdb/login`)

When authentication cookies expire:
1. The portal redirects requests to the public landing page (`https://квартплата.онлайн/`).
2. The `checkIsLoginRequired` utility detects this redirection and triggers `needsLogin: true`.
3. If the internal API returns HTML instead of JSON, `ExpiredSessionError` is thrown.
4. The scan finishes with status `needs_login`, sending an alert to Telegram (`🔑 Требуется авторизация`) and automatically launching the visual browser container.

### 1-Click Session Renewal via Telegram
When authorization is required:
1. The Telegram bot sends a message with buttons:
   * `[ 🌐 Открыть браузер ]` -> `https://browser.viasglobal.es`
   * `[ ✅ Я вошел в кабинет ]`
2. The administrator clicks `🌐 Открыть браузер`, enters phone and SMS code in the remote Chromium window.
3. Upon seeing their apartments, the administrator returns to Telegram and clicks `✅ Я вошел в кабинет`.
4. The bot stops the visual browser container (ensuring clean flush of session cookies to disk), automatically verifies the session via a live control scan, and confirms successful renewal.
5. In addition, the command `/browser` and the `🔑 Браузер ЖКХ` button in the admin menu can start the browser on demand at any time.

### File & Invoice Storage (Local Storage)
* **Local Storage**: All invoices, payment receipts, and documents are stored locally on the server in `apps/accountant/data/uploads/` via internal HTTP streaming (`PUT /accountant/invoices/upload-raw`).
* **Overwrite Protection**: Uploads via `upload-raw` reject existing files with `409 Conflict` unless explicit `?overwrite=true` query parameter is provided.
* **Persistent Volumes**: The `accountant` container mounts `${ACCOUNTANT_PATH}/data:/app/data` to ensure all PDFs survive container rebuilds.
* **Serving Files**:
  * **Telegram Bot**: Internal HTTP buffer fetch from `accountant:3005` inside the Docker network, sent to Telegram as native documents.
  * **Admin UI**: Next.js proxy route `/api/invoices/[id]/download` streams the PDF directly to the client browser.
  * **Direct HTTP**: Download endpoint `GET /accountant/storage/download?key=...` or `GET /accountant/invoices/download/:key`.

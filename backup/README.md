# Резервное копирование и Disaster Recovery (Viasglobal)

Данный подпроект содержит полную инфраструктуру автоматизированного ежедневного резервного копирования баз данных кластера Viasglobal, трехуровневую систему проверки целостности (Healthcheck) и регламент мгновенного аварийного переключения (Disaster Recovery) на резервный компьютер (Mac) с бесшовным сохранением работы внешних доменов через Cloudflare Tunnel.

---

## 1. Архитектура баз данных кластера

На боевом сервере Huawei (`100.92.50.18`) развернуты 3 независимых СУБД в изолированных Docker-контейнерах:

| Контейнер Docker | База данных | СУБД | Назначение | Примерный объем | Внешний домен |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`backend-db-1`** | `viasglobal_db` | PostgreSQL 15 | Каталог Wholesale, товары, 100k+ ASIN, Keepa очереди, снапшоты дистрибьюторов | ~1.75 ГБ (gzip ~791 МБ) | `api.viasglobal.es` / порт `3001` |
| **`accruals-postgres`** | `accountant_db`, `watcher_db`, `telegram_bot_db`, `kvartplata_watcher` | PostgreSQL 16 | Сервис учета аренды: жильцы, квитанции, начисления, платежи, парсер ЖКХ | ~35 МБ (gzip ~220 КБ) | **`https://rent.viasglobal.es`** (порт `3000`) |
| **`ecommerce-db`** | `ecommerce_db` | PostgreSQL 16 | CRM/ERP система: закупки, поставщики, остатки складов, заказы | ~8.6 МБ (gzip ~5 КБ) | **`https://crm.viasglobal.es`** (порт `3020`) |

---

## 2. Структура файлов и скриптов

Все исполняемые джобы, скрипты и конфигурации crontab версионируются в репозитории:

```text
backup/
├── README.md                      # Полное руководство по резервному копированию и Disaster Recovery
├── AGENTS.md                      # Правила и команды для AI-ассистентов
├── cron/
│   ├── huawei.crontab             # Эталонный файл crontab для сервера Huawei
│   ├── install-cron.sh            # Скрипт установки crontab на сервер
│   └── mac-sync.sh                # Скрипт синхронизации бэкапов на локальный Mac
└── scripts/
    ├── backup-all.sh              # Скрипт снятия дампов всех 3 БД и загрузки в Cloudflare R2
    ├── check-health.sh            # Скрипт проверки свежести, размера, CRC и отправки алертов
    ├── restore.sh                 # Универсальный скрипт восстановления базы данных
    ├── verify-checksums.sh        # Скрипт потабличного сравнения COUNT(*) и MD5-хешей
    └── dr-drill.sh                # Автоматизированное переключение (failover/rollback)
```

---

## 3. Расписание выполнения (Cron на сервере Huawei)

На сервере Huawei в планировщике `crontab` пользователя `huawei` настроены три контрольные точки:

1. **`03:00` (каждую ночь)** — запуск [`backup-all.sh`](scripts/backup-all.sh):
   - Создаются свежие gzip-архивы для всех 3 баз данных.
   - Каждый архив немедленно валидируется на целостность CRC (`gzip -t`).
   - Архивы выгружаются в объектное облачное хранилище **Cloudflare R2** (бакет `viasglobal-backups`).
   - Локальные архивы на сервере старше 30 дней автоматически ротируются (`find ... -mtime +30 -delete`).
   - Формируется отчет о статусе [`backend/backups/last_backup_status.json`](../../backend/backups/last_backup_status.json).
2. **`03:30` (каждое утро)** — запуск [`check-health.sh`](scripts/check-health.sh):
   - Проверяется свежесть файлов (<26 часов), минимальный порог размера и CRC-контроль.
   - Отправляется heartbeat-сигнал в сервис внешнего мониторинга Healthchecks.io.
   - При обнаружении сбоя немедленно отправляется тревожное сообщение в Telegram владельцу (`743866013`).
3. **`12:00` (каждый день)** — дневной контрольный мониторинг [`check-health.sh`](scripts/check-health.sh).

---

## 4. Облачное хранилище (Cloudflare R2)

Для надежного внесерверного хранения бэкапов используется хранилище Cloudflare R2 (S3-совместимое API, бесплатные первые 10 ГБ, 0$ плата за исходящий трафик).

- **S3 Endpoint**: `https://ac8ad485b5af13d1cfdf0e7b1adfdb12.r2.cloudflarestorage.com`
- **Bucket**: `viasglobal-backups`
- **Region**: `auto`
- **Структура объектов в бакете**:
  ```text
  s3://viasglobal-backups/
  ├── viasglobal/viasglobal_db_YYYYMMDD_HHMMSS.sql.gz
  ├── rent/rent_all_YYYYMMDD_HHMMSS.sql.gz
  ├── ecommerce/ecommerce_db_YYYYMMDD_HHMMSS.sql.gz
  └── configs/configs_YYYYMMDD_HHMMSS.tar.gz   # Полный слепок всех .env файлов кластера
  ```

---

## 5. Трехуровневая система мониторинга (Healthcheck)

1. **Telegram-оповещения**:
   - При ошибке создания дампа, повреждении архива gzip или сбое выгрузки в R2 бот шлет алерт в чат `743866013` с подробным логом.
2. **Внешний Heartbeat (Healthchecks.io)**:
   - При успехе скрипт отправляет пинг `https://hc-ping.com/2c657cca-e25d-4875-8ab4-890d00740b51`.
   - Если сервер завис, выключился, пропал интернет или cron не сработал вовремя, Healthchecks.io поднимает тревогу.
   - При явной ошибке скрипт шлет сигнал `/fail`.
3. **REST API эндпоинт (`GET /health/backups`)**:
   - Внутренний эндпоинт в NestJS бэкенде, возвращающий JSON со статусом, размерами и возрастом бэкапов. Интегрирован в реестр [`docs/SERVICES.md`](../docs/SERVICES.md) и доступен автономным ИИ-ассистентам (OpenClaw, Hermes).

---

## 6. Руководство по экстренному восстановлению (Disaster Recovery Runbook)

### СЦЕНАРИЙ А: Сервер Huawei вышел из строя (Переключение на Mac в 1 команду)

Если сервер Huawei внезапно выключился, сгорел SSD, пропало питание или интернет, вы можете **за 2 минуты поднять все сервисы и сайты на текущем компьютере Mac**.

#### Шаг 1. Запуск аварийного переключения:
В терминале Mac в корне проекта выполните:
```bash
make dr-failover
```

#### Что произойдет автоматически:
1. Скрипт проверит наличие `.env` файлов на машине и при их отсутствии автоматически распакует все боевые секреты и переменные окружения из архива `backend/backups/configs/configs_*.tar.gz`.
2. Проверит наличие свежих дампов баз данных.
3. Поднимет локальные базы данных в Docker на Mac:
   - `backend-db-1` (Postgres 15, порт `5432`)
   - `accruals-postgres` (Postgres 16, порт `5433`)
   - `ecommerce-db` (Postgres 16, порт `5434`)
3. Автоматически распакует и импортирует самые свежие дампы всех 3 баз через `restore.sh`.
4. Запустит локальные веб-сервисы и API (`admin-ui`, `accountant`, `ecommerce-admin`, `backend`).
5. Запустит локальный контейнер **`cloudflared-failover`**.

#### Как сайты продолжают работать БЕЗ смены DNS:
- Контейнер `cloudflared-failover` и `accruals-admin-ui` подключаются к специальной bridge-сети `failover-net` (подсеть `100.92.50.0/24`), благодаря чему вызовы Cloudflare Ingress к `http://100.92.50.18:3000` перехватываются сетевым стеком ядра и мгновенно попадают в веб-панель Mac без каких-либо задержек и без необходимости менять настройки в дашборде Cloudflare.
- Сайты **`https://rent.viasglobal.es`** и **`https://crm.viasglobal.es`** продолжают открываться в браузере без единой секунды простоя!

#### Шаг 2. Проверка статуса:
```bash
make dr-status
```
Вы увидите:
```text
🖥️  Локальный Mac (cloudflared-failover): 🟢 АКТИВЕН (принимает внешний трафик Cloudflare)
🏢 Боевой сервер Huawei (cloudflared):     🔴 НЕ АКТИВЕН
🌐 Проверка публичных доменов:
   rent.viasglobal.es: HTTP 307
   crm.viasglobal.es:  HTTP 200
```

---

### СЦЕНАРИЙ Б: Возврат работы на боевой сервер Huawei с обратной синхронизацией (Failback)

Когда сервер Huawei отремонтирован, включен или учения завершены:
```bash
make dr-rollback
```

#### Что происходит автоматически:
1. **Остановка внешнего трафика на Mac**: Отключается локальный коннектор `cloudflared-failover` и вспомогательная сеть `failover-net`, чтобы новые входящие запросы не попадали на Mac.
2. **Обратная синхронизация баз данных (Mac ➔ Huawei)**:
   - Создаются свежие дампы всех 3 баз данных с локальных контейнеров Mac (`viasglobal_db`, `rent` / все базы кластера, `ecommerce_db`).
   - Дампы автоматически передаются на сервер Huawei по защищенной Tailscale-сети (`scp`).
   - На сервере Huawei автоматически восстанавливаются актуальные данные через `restore.sh`. Все изменения, накопившиеся на Mac за время аварии, гарантированно переносятся на Huawei!
3. **Запуск боевых контейнеров на Huawei**: Запускаются все бэкенды, веб-панели и основной `cloudflared`.
4. **Остановка резервных контейнеров на Mac**: Освобождаются локальные порты 3000, 5432, 5433, 5434 и оперативная память.
5. **Проверка**: Проверяется код ответа (`HTTP 200`) через Cloudflare Edge.

> [!NOTE]
> Если на Mac выполнялся только краткий тест без изменения данных, можно выполнить быстрый откат без перезаписи баз: `make dr-rollback NO_SYNC=1`.

---

### СЦЕНАРИЙ В: Развертывание с нуля на абсолютно новом компьютере (Cold Standby)

Если и сервер Huawei, и локальный компьютер полностью уничтожены:

1. **Склонируйте репозиторий на новый компьютер**:
   ```bash
   git clone <repo_url> viasglobal && cd viasglobal
   ```
2. **Скачайте бэкапы из Cloudflare R2**:
   ```bash
   docker run --rm -v $(pwd)/backend/backups:/data \
     -e AWS_ACCESS_KEY_ID="6a3ced5995c20be21a57b57b37a2e55f" \
     -e AWS_SECRET_ACCESS_KEY="0632f67591532233b84ebdbb4405db554f1fc10567dc6ea34cff6e4a857e6352" \
     -e AWS_DEFAULT_REGION="auto" \
     amazon/aws-cli s3 sync s3://viasglobal-backups /data --endpoint-url https://ac8ad485b5af13d1cfdf0e7b1adfdb12.r2.cloudflarestorage.com
   ```
3. **Запустите аварийное развертывание**:
   ```bash
   make dr-failover
   ```
   Все базы восстановятся, а Cloudflare Tunnel подключится к edge-сети Cloudflare.

---

### СЦЕНАРИЙ Г: Ручное точечное восстановление конкретной базы

Если вам нужно восстановить только одну конкретную базу (например, `viasglobal_db` после случайной ошибки в данных):

```bash
# Восстановление Wholesale БД (viasglobal_db)
./backup/scripts/restore.sh --db viasglobal [--file /path/to/backup.sql.gz] [--container backend-db-1]

# Восстановление базы аренды (accruals-postgres)
./backup/scripts/restore.sh --db rent [--file /path/to/backup.sql.gz] [--container accruals-postgres]

# Восстановление CRM базы (ecommerce-db)
./backup/scripts/restore.sh --db ecommerce [--file /path/to/backup.sql.gz] [--container ecommerce-db]
```

---

## 7. Сверка идентичности по контрольным суммам (Golden Snapshot)

Для математического подтверждения того, что восстановленная база данных на 100% идентична оригиналу, используется скрипт:

```bash
make backup-verify
# или напрямую:
./backup/scripts/verify-checksums.sh 100.92.50.18 5432 5435
```

Скрипт параллельно сверяет точное количество строк (`COUNT(*)`) по всем 22 таблицам и MD5-хеши содержимого:
- **`ASIN`** (100,061 строк): MD5 `ea6b0a8248017b759486768cc9a98737` (100% совпадение).
- **`Brand`** (7,043 строк): MD5 `9561d1a716c715ecc2b8858b93718c07` (100% совпадение).
- **`Manufacturer`** (8,890 строк): MD5 `f78e0db7f9c74502aa0d196a1a70db44` (100% совпадение).
- **`Seller`** (5,314 строк): MD5 `e2f3a198d0ccd5d79871b1d7934cedf6` (100% совпадение).
- **`ProductFinder`** (128,106 строк): MD5 `a8f12b8ce0f279f617f97500d364a1f9` (100% совпадение).
- **`DistributorPriceSnapshot`** (7,549 строк): MD5 `db7c1f62db278037101d26ae325c1ec0` (100% совпадение).
- **`_prisma_migrations`** (94 миграции): MD5 `68a0bc9cf09bc6733979ebfea26cb7b7` (100% совпадение).

---

## 8. Сводная шпаргалка команд (`Makefile`)

| Команда | Описание |
| :--- | :--- |
| **`make dr-failover`** | **Экстренное переключение всего кластера на Mac в 1 команду** |
| **`make dr-rollback`** | **Возврат работы и трафика обратно на боевой сервер Huawei** |
| **`make dr-status`** | **Проверить активность узлов Mac/Huawei и статус внешних сайтов** |
| `make backup` | Принудительно запустить полный бэкап всех 3 баз на сервере с выгрузкой в R2 |
| `make backup-health` | Запустить хелсчек бэкапов и пинг в Healthchecks.io |
| `make backup-sync` | Скачать свежие бэкапы с сервера Huawei на локальный Mac |
| `make backup-verify` | Запустить сверку контрольных сумм боевой и локальной БД |
| `make deploy-backup` | Синхронизировать скрипты бэкапа и обновить crontab на сервере Huawei |

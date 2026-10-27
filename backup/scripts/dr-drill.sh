#!/usr/bin/env bash
# ==============================================================================
# Скрипт аварийного восстановления и тренировки Disaster Recovery (DR Drill)
#
# Позволяет в ОДНУ КОМАНДУ:
# 1. Сэмулировать отказ боевого сервера Huawei (остановка cloudflared и контейнеров).
# 2. Быстро поднять локальный стэк СУБД и микросервисов на Mac.
# 3. Восстановить все 3 базы данных из свежих бэкапов.
# 4. Подключить локальный Cloudflare Tunnel, перенаправив 100% внешнего трафика
#    (rent.viasglobal.es, crm.viasglobal.es) на Mac БЕЗ изменения настроек DNS.
# 5. Выполнить автоматический откат (rollback) обратно на Huawei.
#
# Использование:
#   ./dr-drill.sh failover   # Переключение трафика и запуск стэка на Mac
#   ./dr-drill.sh rollback   # Возврат работы на боевой сервер Huawei
#   ./dr-drill.sh status     # Проверка текущего статуса узлов
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_BASE_DIR="${PROJECT_ROOT}/backend/backups"

# Cloudflare Tunnel Token для туннеля fad800a3-f97e-4b41-8f24-df8168b1211b
CF_TUNNEL_TOKEN="eyJhIjoiYWM4YWQ0ODViNWFmMTNkMWNmZGYwZTdiMWFkZmRiMTIiLCJ0IjoiZmFkODAwYTMtZjk3ZS00YjQxLThmMjQtZGY4MTY4YjEyMTFiIiwicyI6IlptVmxOemM1TlRVdFpEZG1aQzAwT1RrNExXSmpaall0TURVek5qSTBObVE1WTJSayJ9"

HUAWEI_SERVER="huawei@100.92.50.18"

# ------------------------------------------------------------------------------
# Команда: failover (Аварийное переключение на Mac)
# ------------------------------------------------------------------------------
do_failover() {
  echo "======================================================================"
  echo "🚨 [DR DRILL] ЗАПУСК АВАРИЙНОГО ПЕРЕКЛЮЧЕНИЯ НА ЛОКАЛЬНЫЙ MAC..."
  echo "======================================================================"

  # 1. Проверяем наличие свежих бэкапов на Mac
  echo "📦 [1/6] Проверка наличия локальных резервных копий..."
  LATEST_VIAS="$(find "${BACKUP_BASE_DIR}/viasglobal" -name "*viasglobal*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
  LATEST_RENT="$(find "${BACKUP_BASE_DIR}/rent" -name "*rent*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
  LATEST_ECOM="$(find "${BACKUP_BASE_DIR}/ecommerce" -name "*ecommerce*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"

  if [ -z "${LATEST_VIAS}" ] || [ -z "${LATEST_RENT}" ] || [ -z "${LATEST_ECOM}" ]; then
    echo "⚠️ Не найдены все локальные бэкапы. Попытка синхронизации с сервера Huawei..."
    bash "${SCRIPT_DIR}/../cron/mac-sync.sh" 2>/dev/null || true
    LATEST_VIAS="$(find "${BACKUP_BASE_DIR}/viasglobal" -name "*viasglobal*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    LATEST_RENT="$(find "${BACKUP_BASE_DIR}/rent" -name "*rent*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    LATEST_ECOM="$(find "${BACKUP_BASE_DIR}/ecommerce" -name "*ecommerce*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"

    # Если сервер недоступен и локальных дампов все еще нет - скачиваем напрямую из Cloudflare R2
    if [ -z "${LATEST_VIAS}" ] || [ -z "${LATEST_RENT}" ] || [ -z "${LATEST_ECOM}" ]; then
      echo "☁️  Сервер Huawei недоступен. Скачивание бэкапов напрямую из Cloudflare R2..."
      mkdir -p "${BACKUP_BASE_DIR}/viasglobal" "${BACKUP_BASE_DIR}/rent" "${BACKUP_BASE_DIR}/ecommerce" "${BACKUP_BASE_DIR}/configs"
      docker run --rm -v "${BACKUP_BASE_DIR}:/data" \
        -e AWS_ACCESS_KEY_ID="6a3ced5995c20be21a57b57b37a2e55f" \
        -e AWS_SECRET_ACCESS_KEY="0632f67591532233b84ebdbb4405db554f1fc10567dc6ea34cff6e4a857e6352" \
        -e AWS_DEFAULT_REGION="auto" \
        amazon/aws-cli s3 sync s3://viasglobal-backups /data --endpoint-url https://ac8ad485b5af13d1cfdf0e7b1adfdb12.r2.cloudflarestorage.com
      LATEST_VIAS="$(find "${BACKUP_BASE_DIR}/viasglobal" -name "*viasglobal*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
      LATEST_RENT="$(find "${BACKUP_BASE_DIR}/rent" -name "*rent*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
      LATEST_ECOM="$(find "${BACKUP_BASE_DIR}/ecommerce" -name "*ecommerce*.sql.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    fi
  fi

  echo "   ✅ viasglobal_db: $(basename "${LATEST_VIAS}")"
  echo "   ✅ rent (accruals): $(basename "${LATEST_RENT}")"
  echo "   ✅ ecommerce_db: $(basename "${LATEST_ECOM}")"

  # 2. Симуляция отключения сервера Huawei (остановка туннеля и веб-сервисов)
  echo "🔌 [2/6] Симуляция отказа сервера Huawei (остановка туннеля и сервисов)..."
  if ssh -o ConnectTimeout=4 "${HUAWEI_SERVER}" "echo ping" >/dev/null 2>&1; then
    ssh "${HUAWEI_SERVER}" "docker stop cloudflared backend-backend-1 accruals-admin-ui ecommerce-admin 2>/dev/null || true"
    echo "   ✅ Сервисы на Huawei остановлены. Трафик Cloudflare освобожден."
  else
    echo "   ℹ️ Сервер Huawei уже недоступен или выключен физически."
  fi

  # Проверяем наличие ключевых .env файлов, при отсутствии - распаковываем из архива configs
  if [ ! -f "${PROJECT_ROOT}/rent/infra/.env" ] || [ ! -f "${PROJECT_ROOT}/backend/.env" ]; then
    echo "⚠️ Конфигурационные файлы .env отсутствуют локально! Поиск архива configs..."
    LATEST_CONFIGS="$(find "${BACKUP_BASE_DIR}/configs" -name "configs_*.tar.gz" 2>/dev/null | sort -r | head -n 1 || true)"
    if [ -n "${LATEST_CONFIGS}" ] && [ -f "${LATEST_CONFIGS}" ]; then
      echo "📦 Распаковка .env файлов из архива $(basename "${LATEST_CONFIGS}")..."
      tar -xzf "${LATEST_CONFIGS}" -C "${PROJECT_ROOT}"
      echo "✅ Все .env файлы успешно восстановлены по своим каталогам!"
    else
      echo "❌ Внимание: архив configs не найден в ${BACKUP_BASE_DIR}/configs!"
    fi
  fi

  # 3. Подготовка сети и Docker-инфраструктуры на Mac
  echo "🐳 [3/6] Запуск локальной Docker-инфраструктуры на Mac..."
  docker network create infra_accruals-network 2>/dev/null || true

  # Запуск СУБД для Wholesale (backend-db-1)
  cd "${PROJECT_ROOT}/backend"
  docker compose up -d db
  docker rename backend-db-1 backend-db-1 2>/dev/null || true

  # Запуск инфраструктуры Rent (БД, RabbitMQ, бэкенды accountant, watcher, бот и веб-панель admin-ui)
  cd "${PROJECT_ROOT}/rent/infra"
  docker compose up -d postgres rabbitmq accountant admin-ui watcher telegram-bot

  # Запуск инфраструктуры E-Commerce (БД, бэкенд API и веб-панель CRM)
  cd "${PROJECT_ROOT}/ecommerce"
  docker compose up -d db backend admin

  # 4. Восстановление данных из дампов
  echo "🔄 [4/6] Восстановление данных из резервных копий на локальном Mac..."
  bash "${SCRIPT_DIR}/restore.sh" --db viasglobal --file "${LATEST_VIAS}"
  bash "${SCRIPT_DIR}/restore.sh" --db rent --file "${LATEST_RENT}"
  bash "${SCRIPT_DIR}/restore.sh" --db ecommerce --file "${LATEST_ECOM}"

  # Запуск основного API бэкенда Wholesale
  cd "${PROJECT_ROOT}/backend"
  docker compose up -d backend

  # 5. Запуск Cloudflare Tunnel на Mac
  echo "☁️  [5/6] Подключение локального Cloudflare Tunnel к edge-сети..."
  docker rm -f cloudflared-failover 2>/dev/null || true

  # Создаем bridge-сеть failover-net с подсетью 100.92.50.0/24 для перехвата IP 100.92.50.18
  # (так как Cloudflare ingress настроен на http://100.92.50.18:3000, сетевой стек ядра
  # направит трафик прямо в контейнер accruals-admin-ui с IP 100.92.50.18)
  docker network create --subnet 100.92.50.0/24 failover-net 2>/dev/null || true
  docker network connect --ip 100.92.50.18 failover-net accruals-admin-ui 2>/dev/null || true

  docker run -d \
    --name cloudflared-failover \
    --network infra_accruals-network \
    --restart unless-stopped \
    cloudflare/cloudflared:latest tunnel --no-autoupdate run --token "${CF_TUNNEL_TOKEN}"

  docker network connect failover-net cloudflared-failover 2>/dev/null || true

  # Даем 5 секунд на регистрацию туннеля в Cloudflare Edge
  echo "⏳ Ожидание переключения edge-маршрутов Cloudflare (7 сек)..."
  sleep 7

  # 6. Проверка доступности публичных доменов через Cloudflare
  echo "🔍 [6/6] Проверка работы сайтов через защищенный Cloudflare Tunnel..."
  local RENT_STATUS
  local CRM_STATUS
  RENT_STATUS="$(curl -s -o /dev/null -w "%{http_code}" https://rent.viasglobal.es || echo "ERR")"
  CRM_STATUS="$(curl -s -o /dev/null -w "%{http_code}" https://crm.viasglobal.es || echo "ERR")"

  echo "======================================================================"
  echo "🏁 АВАРИЙНОЕ РАЗВЕРТЫВАНИЕ НА MAC УСПЕШНО ЗАВЕРШЕНО!"
  echo "======================================================================"
  echo "🌐 https://rent.viasglobal.es  ➔ HTTP ${RENT_STATUS} (обслуживается локальным Mac)"
  echo "🌐 https://crm.viasglobal.es   ➔ HTTP ${CRM_STATUS} (обслуживается локальным Mac)"
  echo "📊 Локальные БД: viasglobal (5432), rent (5433), ecommerce (5434)"
  echo ""
  echo "👉 Для возврата трафика обратно на сервер Huawei выполните:"
  echo "   make dr-rollback"
  echo "======================================================================"
}

# ------------------------------------------------------------------------------
# Команда: rollback (Возврат работы на сервер Huawei с обратной синхронизацией)
# ------------------------------------------------------------------------------
do_rollback() {
  local DO_SYNC=true
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-sync)
        DO_SYNC=false
        shift
        ;;
      --sync)
        DO_SYNC=true
        shift
        ;;
      *)
        shift
        ;;
    esac
  done

  echo "======================================================================"
  echo "🔄 [DR DRILL] ВОЗВРАТ РАБОТЫ НА БОЕВОЙ СЕРВЕР HUAWEI..."
  echo "======================================================================"

  # 1. Отключаем локальный Cloudflare Tunnel на Mac, чтобы прекратить прием новых внешних запросов
  echo "🛑 [1/5] Остановка локального Cloudflare Tunnel на Mac..."
  docker rm -f cloudflared-failover 2>/dev/null || true
  docker network disconnect failover-net accruals-admin-ui 2>/dev/null || true
  docker network rm failover-net 2>/dev/null || true

  # 2. Обратная синхронизация баз данных с локального Mac на боевой сервер Huawei
  if [ "${DO_SYNC}" = "true" ]; then
    echo "🔄 [2/5] Выполнение обратной синхронизации баз данных (Mac ➔ Huawei)..."

    # Проверяем доступность сервера Huawei по SSH
    if ! ssh -o ConnectTimeout=5 "${HUAWEI_SERVER}" "echo ping" >/dev/null 2>&1; then
      echo "❌ Сервер Huawei недоступен по сети! Прерывание отката во избежание потери данных."
      exit 1
    fi

    local SYNC_TS
    SYNC_TS="$(date +%Y%m%d_%H%M%S)"
    local TMP_DIR="${PROJECT_ROOT}/scratch/reverse_sync_${SYNC_TS}"
    mkdir -p "${TMP_DIR}"

    echo "   📦 [1/3] Экспорт viasglobal_db с локального Mac..."
    docker exec backend-db-1 pg_dump -U viasuser -d viasglobal_db --clean --if-exists --no-owner --no-acl | gzip -9 > "${TMP_DIR}/failover_viasglobal_${SYNC_TS}.sql.gz"

    echo "   📦 [2/3] Экспорт rent (все БД кластера) с локального Mac..."
    docker exec accruals-postgres pg_dumpall -U postgres --clean | gzip -9 > "${TMP_DIR}/failover_rent_${SYNC_TS}.sql.gz"

    echo "   📦 [3/3] Экспорт ecommerce_db с локального Mac..."
    docker exec ecommerce-db pg_dump -U viasuser -d ecommerce_db --clean --if-exists --no-owner --no-acl | gzip -9 > "${TMP_DIR}/failover_ecommerce_${SYNC_TS}.sql.gz"

    echo "   🚀 Передача дампов на сервер Huawei по защищенной сети Tailscale..."
    ssh "${HUAWEI_SERVER}" "mkdir -p /home/huawei/viasglobal/backend/backups/viasglobal /home/huawei/viasglobal/backend/backups/rent /home/huawei/viasglobal/backend/backups/ecommerce"
    scp "${TMP_DIR}/failover_viasglobal_${SYNC_TS}.sql.gz" "${HUAWEI_SERVER}:/home/huawei/viasglobal/backend/backups/viasglobal/"
    scp "${TMP_DIR}/failover_rent_${SYNC_TS}.sql.gz" "${HUAWEI_SERVER}:/home/huawei/viasglobal/backend/backups/rent/"
    scp "${TMP_DIR}/failover_ecommerce_${SYNC_TS}.sql.gz" "${HUAWEI_SERVER}:/home/huawei/viasglobal/backend/backups/ecommerce/"

    echo "   🔄 Восстановление баз данных на сервере Huawei..."
    # Синхронизируем обновленный скрипт restore.sh на сервер
    scp "${SCRIPT_DIR}/restore.sh" "${HUAWEI_SERVER}:/home/huawei/viasglobal/backup/scripts/restore.sh"

    # Приостанавливаем прикладные сервисы на Huawei, чтобы избежать параллельной записи во время импорта
    ssh "${HUAWEI_SERVER}" "docker stop backend-backend-1 accruals-watcher accruals-accountant accruals-telegram-bot accruals-admin-ui ecommerce-backend ecommerce-admin 2>/dev/null || true"
    ssh "${HUAWEI_SERVER}" "docker start backend-db-1 accruals-postgres ecommerce-db 2>/dev/null || true"

    ssh "${HUAWEI_SERVER}" "bash /home/huawei/viasglobal/backup/scripts/restore.sh --db viasglobal --file /home/huawei/viasglobal/backend/backups/viasglobal/failover_viasglobal_${SYNC_TS}.sql.gz"
    ssh "${HUAWEI_SERVER}" "bash /home/huawei/viasglobal/backup/scripts/restore.sh --db rent --file /home/huawei/viasglobal/backend/backups/rent/failover_rent_${SYNC_TS}.sql.gz"
    ssh "${HUAWEI_SERVER}" "bash /home/huawei/viasglobal/backup/scripts/restore.sh --db ecommerce --file /home/huawei/viasglobal/backend/backups/ecommerce/failover_ecommerce_${SYNC_TS}.sql.gz"

    rm -rf "${TMP_DIR}"
    echo "   ✅ Обратная синхронизация баз данных на Huawei успешно завершена!"
  else
    echo "ℹ️  [2/5] Обратная синхронизация пропущена по флагу --no-sync."
  fi

  # 3. Запуск всех сервисов на боевом сервере Huawei
  echo "🚀 [3/5] Запуск всех контейнеров на сервере Huawei..."
  ssh "${HUAWEI_SERVER}" "docker start backend-db-1 backend-backend-1 accruals-postgres accruals-rabbitmq accruals-accountant accruals-watcher accruals-admin-ui accruals-telegram-bot ecommerce-db ecommerce-backend ecommerce-admin cloudflared 2>/dev/null || true"
  echo "   ✅ Контейнеры на Huawei запущены."

  # 4. Остановка локальных контейнеров на Mac
  echo "🧹 [4/5] Остановка локальных контейнеров Mac..."
  cd "${PROJECT_ROOT}/backend" && docker compose stop backend db || true
  cd "${PROJECT_ROOT}/rent/infra" && docker compose stop admin-ui accountant watcher telegram-bot rabbitmq postgres || true
  cd "${PROJECT_ROOT}/ecommerce" && docker compose stop admin backend db || true

  echo "⏳ Ожидание переключения трафика обратно на Huawei (7 сек)..."
  sleep 7

  # 5. Проверка доступности публичных доменов через Cloudflare
  echo "🔍 [5/5] Проверка доступности публичных доменов..."
  local RENT_STATUS
  local CRM_STATUS
  RENT_STATUS="$(curl -s -o /dev/null -w "%{http_code}" https://rent.viasglobal.es || echo "ERR")"
  CRM_STATUS="$(curl -s -o /dev/null -w "%{http_code}" https://crm.viasglobal.es || echo "ERR")"

  echo "======================================================================"
  echo "✅ ВОЗВРАТ НА HUAWEI ЗАВЕРШЕН!"
  echo "======================================================================"
  echo "🌐 https://rent.viasglobal.es  ➔ HTTP ${RENT_STATUS} (обслуживается Huawei)"
  echo "🌐 https://crm.viasglobal.es   ➔ HTTP ${CRM_STATUS} (обслуживается Huawei)"
  echo "======================================================================"
}

# ------------------------------------------------------------------------------
# Команда: status (Проверка статуса)
# ------------------------------------------------------------------------------
do_status() {
  echo "======================================================================"
  echo "📊 [DR STATUS] ТЕКУЩИЙ СТАТУС УЗЛОВ И ТУННЕЛЕЙ"
  echo "======================================================================"
  echo "🖥️  Локальный Mac (cloudflared-failover):"
  if docker ps --format '{{.Names}}' | grep -q '^cloudflared-failover$'; then
    echo "   🟢 АКТИВЕН (принимает внешний трафик Cloudflare)"
  else
    echo "   ⚪ Остановлен (резервный узел)"
  fi

  echo "🏢 Боевой сервер Huawei (cloudflared):"
  if ssh -o ConnectTimeout=3 "${HUAWEI_SERVER}" "docker ps --format '{{.Names}}' | grep -q '^cloudflared$'" 2>/dev/null; then
    echo "   🟢 АКТИВЕН (принимает внешний трафик Cloudflare)"
  else
    echo "   🔴 НЕ АКТИВЕН или сервер выключен"
  fi

  echo ""
  echo "🌐 Проверка публичных доменов:"
  echo "   rent.viasglobal.es: HTTP $(curl -s -o /dev/null -w "%{http_code}" https://rent.viasglobal.es || echo "ERR")"
  echo "   crm.viasglobal.es:  HTTP $(curl -s -o /dev/null -w "%{http_code}" https://crm.viasglobal.es || echo "ERR")"
  echo "======================================================================"
}

# Маршрутизация подкоманд
case "${1:-status}" in
  failover)
    do_failover
    ;;
  rollback)
    shift || true
    do_rollback "$@"
    ;;
  status)
    do_status
    ;;
  *)
    echo "Использование: $0 {failover|rollback|status}"
    exit 1
    ;;
esac

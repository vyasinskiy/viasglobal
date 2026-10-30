#!/usr/bin/env bash
# ==============================================================================
# Скрипт ежедневной проверки здоровья (Healthcheck) резервных копий Viasglobal
#
# Проверяет:
# 1. Наличие свежих бэкапов за последние 26 часов для всех баз (viasglobal_db, rent).
# 2. Адекватность размеров файлов (защита от пустых дампов).
# 3. Целостность архивов (проверка CRC через gzip -t).
# 4. Уведомляет владельца через Telegram при сбое (бот 8489630295 в чат 743866013).
# 5. Отправляет heartbeat в сервис Healthchecks.io (успех или /fail).
# ==============================================================================

# Строгий режим выполнения
set -euo pipefail

# Определяем базовые пути
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_BASE_DIR="${PROJECT_ROOT}/ecommerce/backend/backups"
HEALTH_FILE="${BACKUP_BASE_DIR}/health_status.json"

# Загружаем конфигурацию из .env
if [ -f "${PROJECT_ROOT}/ecommerce/backend/.env" ]; then
  set -a
  source "${PROJECT_ROOT}/ecommerce/backend/.env"
  set +a
fi

if [ -f "${PROJECT_ROOT}/sms-gateway/.env" ]; then
  # Извлекаем Telegram настройки из sms-gateway/.env при необходимости
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    TELEGRAM_BOT_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "${PROJECT_ROOT}/sms-gateway/.env" | cut -d '=' -f2- | tr -d '\"' || true)"
  fi
  if [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    TELEGRAM_CHAT_ID="$(grep -E '^TELEGRAM_CHAT_ID=' "${PROJECT_ROOT}/sms-gateway/.env" | cut -d '=' -f2- | tr -d '\"' || true)"
  fi
fi

# URL пинга Healthchecks.io (по умолчанию или из переменной окружения)
HC_PING_URL="${HEALTHCHECK_BACKUP_URL:-https://hc-ping.com/2c657cca-e25d-4875-8ab4-890d00740b51}"

# Порог свежести бэкапа: 26 часов (93600 секунд)
MAX_AGE_SECONDS=93600
CURRENT_TIME="$(date +%s)"

ERRORS=()
WARNINGS=()
DETAILS=()

# ------------------------------------------------------------------------------
# Вспомогательная функция отправки сообщения в Telegram через Bot API
# ------------------------------------------------------------------------------
send_telegram() {
  local TEXT="$1"
  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    # Поддерживаем отправку в несколько чатов, если они разделены запятыми
    IFS=',' read -ra CHATS <<< "${TELEGRAM_CHAT_ID}"
    for CHAT in "${CHATS[@]}"; do
      CHAT_CLEAN="$(echo "${CHAT}" | tr -d ' ')"
      if [ -n "${CHAT_CLEAN}" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
          -d "chat_id=${CHAT_CLEAN}" \
          -d "parse_mode=HTML" \
          -d "text=${TEXT}" > /dev/null 2>&1 || true
      fi
    done
  fi
}

# ------------------------------------------------------------------------------
# Функция валидации конкретной базы данных
# Аргументы: $1=имя_бд, $2=подкаталог, $3=мин_размер_байт, $4=паттерн_файла
# ------------------------------------------------------------------------------
check_database_backup() {
  local DB_NAME="$1"
  local SUBDIR="$2"
  local MIN_SIZE="$3"
  local PATTERN="$4"

  local TARGET_DIR="${BACKUP_BASE_DIR}/${SUBDIR}"
  if [ ! -d "${TARGET_DIR}" ]; then
    # Проверяем также корень BACKUP_BASE_DIR для обратной совместимости
    TARGET_DIR="${BACKUP_BASE_DIR}"
  fi

  # Находим самый свежий файл бэкапа по паттерну в подкаталоге или общем каталоге
  local LATEST_FILE
  LATEST_FILE="$(find "${TARGET_DIR}" "${BACKUP_BASE_DIR}" -type f -name "${PATTERN}" 2>/dev/null | sort -r | head -n 1 || true)"

  if [ -z "${LATEST_FILE}" ]; then
    ERRORS+=("❌ [${DB_NAME}] Файл бэкапа отсутствует в ${TARGET_DIR}!")
    return
  fi

  local FILE_NAME="$(basename "${LATEST_FILE}")"
  local FILE_SIZE="$(stat -f%z "${LATEST_FILE}" 2>/dev/null || stat -c%s "${LATEST_FILE}" 2>/dev/null || echo 0)"
  local FILE_MTIME="$(stat -f%m "${LATEST_FILE}" 2>/dev/null || stat -c%Y "${LATEST_FILE}" 2>/dev/null || echo 0)"
  local AGE_SECONDS=$((CURRENT_TIME - FILE_MTIME))
  local AGE_HOURS=$((AGE_SECONDS / 3600))

  # 1. Проверка возраста файла
  if [ "${AGE_SECONDS}" -gt "${MAX_AGE_SECONDS}" ]; then
    ERRORS+=("❌ [${DB_NAME}] Бэкап ${FILE_NAME} устарел! Возраст: ${AGE_HOURS} ч (норма: <26 ч)")
  fi

  # 2. Проверка минимального размера
  if [ "${FILE_SIZE}" -lt "${MIN_SIZE}" ]; then
    ERRORS+=("❌ [${DB_NAME}] Бэкап ${FILE_NAME} подозрительно мал: ${FILE_SIZE} байт (ожидается >= ${MIN_SIZE})")
  fi

  # 3. Проверка целостности gzip
  if gzip -t "${LATEST_FILE}" 2>/dev/null; then
    DETAILS+=("✅ <b>${DB_NAME}</b>: ${FILE_NAME} ($((FILE_SIZE / 1024 / 1024)) МБ, ${AGE_HOURS} ч назад, CRC OK)")
  else
    ERRORS+=("❌ [${DB_NAME}] Архив ${FILE_NAME} ПОВРЕЖДЕН (ошибка CRC/gzip)!")
  fi
}

echo "======================================================================"
echo "🔍 [$(date '+%Y-%m-%d %H:%M:%S')] Проверка целостности бэкапов Viasglobal..."
echo "======================================================================"

# Проверяем все 3 базы данных
# 1. viasglobal_db (ожидаем минимум 5 МБ, текущий размер ~10.5 МБ)
check_database_backup "viasglobal_db" "viasglobal" 5242880 "*viasglobal*.sql.gz"
if [ ${#DETAILS[@]} -eq 0 ] && [ ${#ERRORS[@]} -gt 0 ]; then
  # Если по новому паттерну не найден, ищем старый формат backup_YYYYMMDD_*.sql.gz
  ERRORS=()
  check_database_backup "viasglobal_db" "." 5242880 "backup_*.sql.gz"
fi

# 2. rent (viasrent, ожидаем минимум 50 КБ)
check_database_backup "rent (viasrent)" "rent" 51200 "*rent*.sql.gz"
if [ ${#DETAILS[@]} -lt 2 ]; then
  check_database_backup "rent (viasrent)" "rent" 51200 "db_backup_*.sql.gz"
fi



# Проверяем журнал выгрузки в S3 (если был сбой)
if [ -f "${BACKUP_BASE_DIR}/last_backup_status.json" ]; then
  S3_ERRORS="$(jq -r '.errors[]?' "${BACKUP_BASE_DIR}/last_backup_status.json" 2>/dev/null || true)"
  if [ -n "${S3_ERRORS}" ]; then
    WARNINGS+=("⚠️ Ошибки при выгрузке в облако: ${S3_ERRORS}")
  fi
fi

# Сохраняем итоговый статус в JSON
OVERALL_STATUS="healthy"
if [ ${#ERRORS[@]} -gt 0 ]; then
  OVERALL_STATUS="failed"
elif [ ${#WARNINGS[@]} -gt 0 ]; then
  OVERALL_STATUS="warning"
fi

to_json_array() {
  if [ "$#" -eq 0 ] || [ -z "${1:-}" ]; then
    echo "[]"
  else
    printf '%s\n' "$@" | jq -R . | jq -s . 2>/dev/null || echo "[]"
  fi
}

cat <<EOF > "${HEALTH_FILE}"
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "${OVERALL_STATUS}",
  "checksPassed": $([ ${#ERRORS[@]} -eq 0 ] && echo "true" || echo "false"),
  "errors": $(to_json_array "${ERRORS[@]+"${ERRORS[@]}"}"),
  "warnings": $(to_json_array "${WARNINGS[@]+"${WARNINGS[@]}"}"),
  "details": $(to_json_array "${DETAILS[@]+"${DETAILS[@]}"}")
}
EOF


# ------------------------------------------------------------------------------
# Обработка результатов: оповещение и пинги
# ------------------------------------------------------------------------------
if [ "${OVERALL_STATUS}" = "healthy" ]; then
  echo "✅ Все проверки бэкапов успешно пройдены!"
  if [ ${#DETAILS[@]} -gt 0 ]; then
    for DET in "${DETAILS[@]}"; do
      echo "   ${DET}"
    done
  fi

  # Пингуем Healthchecks.io с сигналом успеха
  curl -fsS -m 10 --retry 3 "${HC_PING_URL}" > /dev/null 2>&1 || true

  # Если включена отправка успешных сводок в Telegram
  if [ "${TELEGRAM_NOTIFY_ON_SUCCESS:-false}" = "true" ]; then
    MSG="✅ <b>Бэкапы Viasglobal в порядке</b>%0A"
    for DET in "${DETAILS[@]}"; do
      MSG="${MSG}%0A• ${DET}"
    done
    send_telegram "${MSG}"
  fi
else
  echo "❌ Обнаружены проблемы при проверке бэкапов!"
  if [ ${#ERRORS[@]} -gt 0 ]; then
    for ERR in "${ERRORS[@]}"; do
      echo "   ${ERR}"
    done
  fi
  if [ ${#WARNINGS[@]} -gt 0 ]; then
    for WARN in "${WARNINGS[@]}"; do
      echo "   ${WARN}"
    done
  fi

  # Пингуем Healthchecks.io с ошибкой (/fail)
  FAIL_PAYLOAD="Статус: ${OVERALL_STATUS}."
  curl -fsS -m 10 --retry 3 "${HC_PING_URL}/fail" -d "${FAIL_PAYLOAD}" > /dev/null 2>&1 || true

  # Отправляем тревожное сообщение в Telegram
  ALERT_MSG="🚨 <b>ВНИМАНИЕ: Сбой бэкапов на сервере Huawei!</b>%0A%0A"
  if [ ${#ERRORS[@]} -gt 0 ]; then
    for ERR in "${ERRORS[@]}"; do
      ALERT_MSG="${ALERT_MSG}${ERR}%0A"
    done
  fi
  if [ ${#WARNINGS[@]} -gt 0 ]; then
    for WARN in "${WARNINGS[@]}"; do
      ALERT_MSG="${ALERT_MSG}${WARN}%0A"
    done
  fi
  ALERT_MSG="${ALERT_MSG}%0A<i>Требуется вмешательство для предотвращения потери данных.</i>"
  send_telegram "${ALERT_MSG}"

  # Выходим с ненулевым кодом для сигнализации в cron
  exit 1
fi


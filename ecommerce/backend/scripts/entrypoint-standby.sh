#!/bin/bash
set -e

# Очищаем директорию, если она содержит старые данные (чтобы pg_basebackup не ругался)
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    echo "Standby database is empty. Fetching base backup from primary (100.92.50.18)..."
    export PGPASSWORD='vias_replica_pwd'
    
    # Ждем, пока primary БД станет доступна
    until pg_isready -h 100.92.50.18 -U replicator; do
      echo "Waiting for primary database at 100.92.50.18 to be ready..."
      sleep 2
    done
    
    # Удаляем все пустые папки, которые мог создать Docker
    rm -rf "$PGDATA"/*
    
    # Скачиваем полный дамп и настраиваем режим Standby (-R)
    pg_basebackup -h 100.92.50.18 -D "$PGDATA" -U replicator -v -P -X stream -R
    echo "Base backup completed successfully."
fi

# Передаем управление стандартному скрипту Docker (запуск postgres)
exec docker-entrypoint.sh "$@"

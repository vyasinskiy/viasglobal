#!/bin/bash
set -e

# Создаем пользователя для репликации
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER replicator REPLICATION LOGIN ENCRYPTED PASSWORD 'vias_replica_pwd';
EOSQL

# Разрешаем подключения для репликации из подсети Tailscale (100.64.0.0/10)
echo "host replication replicator 100.64.0.0/10 scram-sha-256" >> "$PGDATA/pg_hba.conf"

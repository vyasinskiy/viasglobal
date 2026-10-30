.PHONY: backup backup-all backup-health backup-sync backup-verify restore-local deploy-backup dr-failover dr-rollback dr-status test db-reset redeploy-back deploy-huawei

backup:
	@echo "Запуск бэкапа всех баз данных на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && bash backup/scripts/backup-all.sh"

backup-health:
	@echo "Запуск хелсчека резервных копий на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && bash backup/scripts/check-health.sh"

backup-sync:
	@echo "Синхронизация бэкапов с сервера Huawei на Mac..."
	@bash backup/cron/mac-sync.sh

backup-verify:
	@echo "Сверка контрольных сумм и количества строк между Huawei и локальной базой..."
	@bash backup/scripts/verify-checksums.sh 100.92.50.18 5432 5435

deploy-backup:
	@echo "Синхронизация скриптов бэкапа и cron-задач на сервер Huawei..."
	rsync -avz ./backup/ huawei@100.92.50.18:~/viasglobal/backup/
	@echo "Установка cron-расписания на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && bash backup/cron/install-cron.sh"

dr-failover:
	@echo "Запуск аварийного переключения на локальный Mac (Disaster Recovery)..."
	@bash backup/scripts/dr-drill.sh failover

dr-rollback:
	@echo "Возврат работы и трафика на боевой сервер Huawei..."
	@bash backup/scripts/dr-drill.sh rollback $(if $(filter 1 true,$(NO_SYNC)),--no-sync,--sync)

dr-status:
	@echo "Проверка текущего статуса узлов и Cloudflare туннелей..."
	@bash backup/scripts/dr-drill.sh status

test:
	@echo "Запуск всех тестов..."
	@cd ecommerce/backend && npm run test

db-reset:
	@echo "Полный сброс базы данных и загрузка свежих выгрузок..."
	@cd ecommerce/backend && npm run db:reset

redeploy-back:
	@echo "Пересборка и перезапуск бэкенда (с новыми переменными окружения)..."
	@cd ecommerce/backend && docker compose up -d --build backend

redeploy-crm:
	@echo "Синхронизация файлов ecommerce/crm на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' ./ecommerce/crm/ huawei@100.92.50.18:~/viasglobal/ecommerce/crm/
	@echo "Пересборка и перезапуск контейнера ecommerce-admin на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/ecommerce/backend && docker compose up -d --build ecommerce-admin"

deploy-master:
	@echo "Синхронизация файлов на сервер..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'postgres-data' --exclude '.env' --exclude '.next' --exclude '.playwright-browsers' --exclude 'backups' --exclude 'data' --exclude 'uploads' ./ huawei@100.92.50.18:~/viasglobal/
	@echo "Пересборка и перезапуск бэкенда на сервере..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && make redeploy-back"
	@echo "Применение миграций базы данных внутри контейнера..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/ecommerce/backend && docker compose exec -T backend sh scripts/deploy-db.sh"

deploy-rent:
	@echo "Синхронизация файлов проекта rent на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'postgres-data' --exclude '.next' --exclude '.playwright-browsers' --exclude 'backups' --exclude 'data' --exclude '.env' ./rent/ huawei@100.92.50.18:~/viasglobal/rent/
	@echo "Запуск развертывания проекта rent на сервере..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent && make deploy"


redeploy-rent-bot:
	@echo "Синхронизация telegram-bot на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' ./rent/apps/telegram-bot/ huawei@100.92.50.18:~/viasglobal/rent/apps/telegram-bot/
	rsync -avz --exclude 'backups' --exclude '.env' ./rent/infra/ huawei@100.92.50.18:~/viasglobal/rent/infra/
	@echo "Пересборка и перезапуск контейнера viasrent-telegram-bot на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build telegram-bot"

redeploy-rent-watcher:
	@echo "Синхронизация watcher и infra на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' --exclude '.playwright-browsers' --exclude 'data' ./rent/apps/watcher/ huawei@100.92.50.18:~/viasglobal/rent/apps/watcher/
	rsync -avz --exclude 'backups' --exclude '.env' ./rent/infra/ huawei@100.92.50.18:~/viasglobal/rent/infra/
	rsync -avz ./rent/.agents/ huawei@100.92.50.18:~/viasglobal/rent/.agents/
	rsync -avz ./rent/README.md huawei@100.92.50.18:~/viasglobal/rent/
	@echo "Пересборка и перезапуск контейнера viasrent-watcher на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose --profile manual create visual-browser || true"
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build watcher"

redeploy-rent-accountant:
	@echo "Синхронизация accountant на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' ./rent/apps/accountant/ huawei@100.92.50.18:~/viasglobal/rent/apps/accountant/
	rsync -avz --exclude 'backups' --exclude '.env' ./rent/infra/ huawei@100.92.50.18:~/viasglobal/rent/infra/
	@echo "Пересборка и перезапуск контейнера viasrent-accountant на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build accountant"

redeploy-rent-admin:
	@echo "Синхронизация admin-ui на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' --exclude '.env' ./rent/apps/admin-ui/ huawei@100.92.50.18:~/viasglobal/rent/apps/admin-ui/
	rsync -avz ./rent/.agents/ huawei@100.92.50.18:~/viasglobal/rent/.agents/
	rsync -avz ./rent/README.md huawei@100.92.50.18:~/viasglobal/rent/
	@echo "Пересборка и перезапуск контейнера viasrent-admin-ui на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build admin-ui"

redeploy-rent-services: redeploy-rent-accountant redeploy-rent-watcher redeploy-rent-admin redeploy-rent-bot
	@echo "Все сервисы rent успешно обновлены и перезапущены!"



deploy-openclaw:
	@echo "Синхронизация документации и базы знаний на сервер Huawei..."
	rsync -avz ./ecommerce/docs/ huawei@100.92.50.18:~/viasglobal/ecommerce/docs/
	rsync -avz ./ecommerce/contractors/ huawei@100.92.50.18:~/viasglobal/ecommerce/contractors/
	rsync -avz ./legal/ huawei@100.92.50.18:~/viasglobal/legal/
	@echo "Синхронизация файлов OpenClaw на сервер Huawei..."
	rsync -avz --exclude 'data' --exclude 'node_modules' ./openclaw/ huawei@100.92.50.18:~/viasglobal/openclaw/
	@echo "Развертывание сервиса viasglobal-openclaw на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/openclaw && bash deploy.sh"

redeploy-openclaw:
	@echo "Синхронизация документации и базы знаний на сервер Huawei..."
	rsync -avz ./ecommerce/docs/ huawei@100.92.50.18:~/viasglobal/ecommerce/docs/
	rsync -avz ./ecommerce/contractors/ huawei@100.92.50.18:~/viasglobal/ecommerce/contractors/
	rsync -avz ./legal/ huawei@100.92.50.18:~/viasglobal/legal/
	@echo "Синхронизация файлов OpenClaw на сервер Huawei..."
	rsync -avz --exclude 'data' --exclude 'node_modules' ./openclaw/ huawei@100.92.50.18:~/viasglobal/openclaw/
	@echo "Развертывание и перезапуск сервиса viasglobal-openclaw..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/openclaw && bash deploy.sh"

clean-redeploy-openclaw:
	@echo "1. Синхронизация репозитория через git pull на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && git pull origin main"
	@echo "2. Синхронизация файлов OpenClaw и базы знаний..."
	rsync -avz ./ecommerce/docs/ huawei@100.92.50.18:~/viasglobal/ecommerce/docs/
	rsync -avz ./ecommerce/contractors/ huawei@100.92.50.18:~/viasglobal/ecommerce/contractors/
	rsync -avz ./legal/ huawei@100.92.50.18:~/viasglobal/legal/
	rsync -avz --exclude 'data' --exclude 'node_modules' ./openclaw/ huawei@100.92.50.18:~/viasglobal/openclaw/
	@echo "3. Полный перезапуск и проверка OpenClaw с нуля на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/openclaw && make clean-deploy"


deploy-sms:
	@echo "Синхронизация файлов SMS Gateway на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'data' ./sms-gateway/ huawei@100.92.50.18:~/viasglobal/sms-gateway/
	@echo "Сборка и запуск контейнера sms-gateway на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/sms-gateway && docker compose up -d --build sms-gateway"

redeploy-sms:
	@echo "Синхронизация файлов SMS Gateway на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'data' ./sms-gateway/ huawei@100.92.50.18:~/viasglobal/sms-gateway/
	@echo "Перезапуск контейнера sms-gateway на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/sms-gateway && docker compose up -d --build sms-gateway"

redeploy-viaslangs:
	@echo "Синхронизация файлов viaslangs на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' ./viaslangs/ huawei@100.92.50.18:~/viasglobal/viaslangs/
	@echo "Пересборка и перезапуск контейнера viaslangs-web на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/viaslangs && docker compose -f docker-compose.huawei.yml up -d --build web"





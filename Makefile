.PHONY: backup test db-reset redeploy-back deploy-huawei

backup:
	@echo "Запуск бэкапа базы данных на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/backend && bash scripts/backup.sh"

test:
	@echo "Запуск всех тестов..."
	@cd backend && npm run test

db-reset:
	@echo "Полный сброс базы данных и загрузка свежих выгрузок..."
	@cd backend && npm run db:reset

redeploy-back:
	@echo "Пересборка и перезапуск бэкенда (с новыми переменными окружения)..."
	@cd backend && docker compose up -d --build backend

deploy-master:
	@echo "Синхронизация файлов на сервер..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'postgres-data' --exclude '.env' --exclude '.next' ./ huawei@100.92.50.18:~/viasglobal/
	@echo "Пересборка и перезапуск бэкенда на сервере..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && make redeploy-back"
	@echo "Применение миграций базы данных внутри контейнера..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/backend && docker compose exec -T backend sh scripts/deploy-db.sh"

deploy-rent:
	@echo "Синхронизация файлов проекта rent на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'postgres-data' --exclude '.next' --exclude '.playwright-browsers' --exclude 'backups' ./rent/ huawei@100.92.50.18:~/viasglobal/rent/
	@echo "Запуск развертывания проекта rent на сервере..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent && make deploy"


redeploy-rent-bot:
	@echo "Синхронизация telegram-bot на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' ./rent/apps/telegram-bot/ huawei@100.92.50.18:~/viasglobal/rent/apps/telegram-bot/
	rsync -avz --exclude 'backups' --exclude '.env' ./rent/infra/ huawei@100.92.50.18:~/viasglobal/rent/infra/
	@echo "Пересборка и перезапуск контейнера accruals-telegram-bot на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build telegram-bot"

redeploy-rent-watcher:
	@echo "Синхронизация watcher и infra на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' --exclude '.playwright-browsers' --exclude 'data' ./rent/apps/watcher/ huawei@100.92.50.18:~/viasglobal/rent/apps/watcher/
	rsync -avz --exclude 'backups' --exclude '.env' ./rent/infra/ huawei@100.92.50.18:~/viasglobal/rent/infra/
	rsync -avz ./rent/.agents/ huawei@100.92.50.18:~/viasglobal/rent/.agents/
	rsync -avz ./rent/README.md huawei@100.92.50.18:~/viasglobal/rent/
	@echo "Пересборка и перезапуск контейнера accruals-watcher на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose --profile manual create visual-browser || true"
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build watcher"

redeploy-rent-accountant:
	@echo "Синхронизация accountant на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude '.env' ./rent/apps/accountant/ huawei@100.92.50.18:~/viasglobal/rent/apps/accountant/
	rsync -avz --exclude 'backups' --exclude '.env' ./rent/infra/ huawei@100.92.50.18:~/viasglobal/rent/infra/
	@echo "Пересборка и перезапуск контейнера accruals-accountant на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build accountant"

redeploy-rent-admin:
	@echo "Синхронизация admin-ui на сервер Huawei..."
	rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' --exclude '.env' ./rent/apps/admin-ui/ huawei@100.92.50.18:~/viasglobal/rent/apps/admin-ui/
	@echo "Пересборка и перезапуск контейнера accruals-admin-ui на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/rent/infra && docker compose up -d --build admin-ui"

redeploy-rent-services: redeploy-rent-accountant redeploy-rent-watcher redeploy-rent-admin redeploy-rent-bot
	@echo "Все сервисы rent успешно обновлены и перезапущены!"


deploy-hermes:
	@echo "Синхронизация файлов Hermes на сервер Huawei..."
	rsync -avz --exclude 'data' --exclude '__pycache__' ./hermes/ huawei@100.92.50.18:~/viasglobal/hermes/
	@echo "Развертывание сервиса viasglobal-hermes на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/hermes && make deploy"

redeploy-hermes:
	@echo "Синхронизация обновлений Hermes на сервер Huawei..."
	rsync -avz --exclude 'data' --exclude '__pycache__' ./hermes/ huawei@100.92.50.18:~/viasglobal/hermes/
	@echo "Перезапуск контейнера viasglobal-hermes..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/hermes && docker compose up -d --build hermes"

deploy-openclaw:
	@echo "Синхронизация документации на сервер Huawei..."
	rsync -avz ./docs/ huawei@100.92.50.18:~/viasglobal/docs/
	@echo "Синхронизация файлов OpenClaw на сервер Huawei..."
	rsync -avz --exclude 'data' --exclude 'node_modules' ./openclaw/ huawei@100.92.50.18:~/viasglobal/openclaw/
	@echo "Развертывание сервиса viasglobal-openclaw на сервере Huawei..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/openclaw && bash deploy.sh"

redeploy-openclaw:
	@echo "Синхронизация обновлений OpenClaw на сервер Huawei..."
	rsync -avz --exclude 'data' --exclude 'node_modules' ./openclaw/ huawei@100.92.50.18:~/viasglobal/openclaw/
	@echo "Перезапуск контейнера viasglobal-openclaw..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/openclaw && docker compose up -d --build openclaw"



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
	@echo "Применение миграций базы данных на сервере..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal/backend && npx prisma migrate deploy"
	@echo "Пересборка и перезапуск бэкенда на сервере..."
	ssh huawei@100.92.50.18 "cd ~/viasglobal && make redeploy-back"

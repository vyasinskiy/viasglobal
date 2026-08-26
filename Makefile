.PHONY: backup test db-reset redeploy-backend

backup:
	@echo "Запуск бэкапа базы данных..."
	@cd backend && npm run backup

test:
	@echo "Запуск всех тестов..."
	@cd backend && npm run test

db-reset:
	@echo "Полный сброс базы данных и загрузка свежих выгрузок..."
	@cd backend && npm run db:reset

redeploy-back:
	@echo "Пересборка и перезапуск бэкенда (с новыми переменными окружения)..."
	@cd backend && docker compose up -d --build backend

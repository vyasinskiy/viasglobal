.PHONY: test dev build up down logs restart status sync latest

test:
	@echo "Запуск автотестов SMS Gateway..."
	npm test

dev:
	@echo "Запуск сервиса в режиме разработки..."
	npm run dev

build:
	@echo "Сборка Docker-образа sms-gateway..."
	docker compose build

up:
	@echo "Запуск контейнера sms-gateway в фоновом режиме..."
	docker compose up -d --build

down:
	@echo "Остановка контейнера sms-gateway..."
	docker compose down

restart:
	@echo "Перезапуск контейнера sms-gateway..."
	docker compose restart

logs:
	@echo "Просмотр логов контейнера sms-gateway..."
	docker compose logs -f sms-gateway

status:
	@echo "Проверка здоровья SMS Gateway..."
	@curl -s http://localhost:3040/health | jq . || curl -s http://localhost:3040/health

latest:
	@echo "Получение последнего SMS..."
	@curl -s http://localhost:3040/sms/latest | jq . || curl -s http://localhost:3040/sms/latest

sync:
	@echo "Принудительная синхронизация SMS с телефона..."
	@curl -s -X POST http://localhost:3040/sms/sync | jq . || curl -s -X POST http://localhost:3040/sms/sync

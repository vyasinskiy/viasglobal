.PHONY: backup test

backup:
	@echo "Запуск бэкапа базы данных..."
	@cd backend && npm run backup

test:
	@echo "Запуск всех тестов..."
	@cd backend && npm run test

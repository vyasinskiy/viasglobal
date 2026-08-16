.PHONY: backup

backup:
	@echo "Запуск бэкапа базы данных..."
	@cd backend && npm run backup

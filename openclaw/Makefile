.PHONY: deploy redeploy clean-deploy logs stop restart verify

deploy:
	@bash deploy.sh

clean-deploy:
	@echo "🧹 Остановка старого контейнера OpenClaw..."
	@docker compose down || true
	@echo "🚀 Запуск развертывания с нуля..."
	@bash deploy.sh
	@echo "🔍 Проверка целостности смонтированных данных..."
	@sleep 3
	@docker exec viasglobal-openclaw test -f /home/node/.openclaw/workspace/KNOWLEDGE.md && echo "✅ KNOWLEDGE.md доступен внутри контейнера" || echo "❌ KNOWLEDGE.md отсутствует"
	@docker exec viasglobal-openclaw test -d /home/node/.openclaw/workspace/contractors && echo "✅ contractors/ смонтирован" || echo "❌ contractors/ отсутствует"
	@docker exec viasglobal-openclaw test -d /home/node/.openclaw/workspace/legal && echo "✅ legal/ смонтирован" || echo "❌ legal/ отсутствует"

redeploy:
	@bash deploy.sh

logs:
	@docker compose logs -f openclaw

stop:
	@docker compose down

restart:
	@docker compose restart openclaw

.PHONY: deploy logs stop restart

deploy:
	@bash deploy.sh

logs:
	@docker compose logs -f openclaw

stop:
	@docker compose down

restart:
	@docker compose restart openclaw

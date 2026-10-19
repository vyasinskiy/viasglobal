.PHONY: install dev migrate seed build up down reset-db deploy

install:
	cd backend && npm install
	cd admin && npm install

dev:
	cd backend && npm run start:dev &
	cd admin && npm run dev

migrate:
	cd backend && npx prisma migrate dev --create-only

seed:
	cd backend && npx prisma db execute --file prisma/sql/seed.sql

build:
	cd backend && npm run build
	cd admin && npm run build

up:
	docker compose up -d

down:
	docker compose down

deploy:
	docker compose up -d --build
	sleep 5
	docker compose exec -T backend sh scripts/deploy-db.sh

reset-db:
	docker compose down -v
	docker compose up -d db
	sleep 5
	cd backend && npx prisma migrate deploy
	cd backend && npx prisma db execute --file prisma/sql/seed.sql
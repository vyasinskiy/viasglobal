# Viasglobal Project

## Управление сервером (Huawei PC)

> **IP-адрес сервера:** `100.92.50.18` (Доступен через Tailscale)

### Быстрые ссылки (Мониторинг и Управление)
- 🖥 **Portainer (Логи бэкенда):** [Смотреть логи онлайн](http://100.92.50.18:9000/#!/3/docker/containers/d7d6f557e8176abc051947db1e5f880e71ec78c8c9e282894ddb93b83d4888c6/logs)
- 💓 **Healthchecks (Статус сервера):** [Панель мониторинга](https://healthchecks.io/projects/bd96a452-0e1c-4413-842d-797ccdb2462b/checks/)
- 🗄 **Amazon S3 (Бэкапы БД):** [Корзина с архивами](https://eu-north-1.console.aws.amazon.com/s3/buckets/home-postrges?region=eu-north-1&tab=objects)

### Подключение
- **SSH (Терминал):** `ssh huawei@100.92.50.18`
- **Portainer (Главная):** [http://100.92.50.18:9000](http://100.92.50.18:9000)

### Деплой нового кода с Mac
В корне проекта (папка `viasglobal`):
```bash
make deploy-master
```

### Основные команды (на сервере в папке `~/viasglobal/backend`)
- **Просмотр логов бэкенда (в реальном времени):** `docker logs -f backend-backend-1`
- **Просмотр логов базы данных:** `docker logs -f backend-db-1`
- **Перезапуск бэкенда:** `docker restart backend-backend-1`
- **Выключить проект:** `docker compose down`
- **Включить проект:** `docker compose up -d`
- **Подключиться к PostgreSQL (psql):** `docker exec -it backend-db-1 psql -U viasuser -d viasglobal_db`

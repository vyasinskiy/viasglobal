# Правила и инструкции подпроекта openclaw (OpenClaw Agent)

Этот подпроект содержит автономного AI-ассистента на базе платформы **OpenClaw**, работающего в изолированном Docker-контейнере рядом с сервисом `hermes`.

## 1. Архитектура и стек
- **Платформа**: OpenClaw (Node.js).
- **Docker-образ**: `openclaw/openclaw:latest`.
- **LLM Провайдер**: OpenRouter API (`deepseek/deepseek-chat`).
- **Канал связи**: Персональный Telegram-бот владельца (канал `channels.telegram` с фильтром `allowFrom` и `ownerAllowFrom`).
- **Связь с сервисами**: Сети Docker `infra_accruals-network` и `backend_default`.

## 2. Правила конфигурации и базы знаний
- Конфигурация генерируется скриптом `deploy.sh` из шаблона `config/openclaw.template.json` в `data/openclaw.json`.
- Токены и секреты хранятся строго в `.env` и никогда не коммитятся в git.
- Скрипт `deploy.sh` автоматически копирует глобальный реестр сервисов `docs/SERVICES.md` и инструкции `config/workspace/AGENTS.md` в рабочий каталог агента `data/workspace/`. Это позволяет OpenClaw владеть полной информацией обо всех сервисах кластера, их URL и эндпоинтах.
- При любых изменениях в микросервисах необходимо обновить `docs/SERVICES.md` и выполнить деплой OpenClaw (`make deploy-openclaw`), чтобы агент получил актуальные схемы API.
- Поддерживать в актуальном состоянии оба файла: [README.md](file:///Users/usuario/code/viasglobal/openclaw/README.md) и [AGENTS.md](file:///Users/usuario/code/viasglobal/openclaw/.agents/AGENTS.md).

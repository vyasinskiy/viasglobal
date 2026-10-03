# Правила и инструкции подпроекта hermes (Hermes Agent)

Этот подпроект содержит автономного AI-ассистента на базе **Hermes Agent** (Nous Research), работающего в отдельном Docker-контейнере и управляющего бизнес-процессами через Telegram.

## 1. Архитектура и стек
- **Платформа**: Hermes Agent (Nous Research).
- **LLM Провайдер**: OpenRouter API (`deepseek/deepseek-chat`).
- **Канал связи**: Персональный Telegram-бот владельца (доступ строго по `TELEGRAM_ALLOWED_USERS`).
- **Связь с сервисами**: Вызовы по HTTP REST к соседним микросервисам монорепозитория:
  * Сервис аренды: `accruals-accountant:3005` (`GET /tenants`, `GET /invoices`, `POST /payments`).
  * Сервис оптовой торговли: `backend:3000` (`GET /brands`, `GET /distributors`).

## 2. Правила модификации и расширения
- Все новые инструменты агента (Tools) должны оформляться в директории `tools/` и описываться в `config.yaml`.
- Агент никогда не должен выполнять финансовые списания или создание платежей без предварительного согласования и подтверждения пользователем в чате.
- При любых изменениях логики поддерживать в актуальном состоянии оба файла: [README.md](file:///Users/usuario/code/viasglobal/hermes/README.md) и [AGENTS.md](file:///Users/usuario/code/viasglobal/hermes/.agents/AGENTS.md).


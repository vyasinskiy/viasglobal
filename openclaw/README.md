# Персональный AI-ассистент на платформе OpenClaw

Автономный сервис личного ассистента на базе платформы **OpenClaw**, запущенный в Docker-контейнере параллельно с сервисом `hermes`.

## Возможности

1. **Мультиканальный шлюз OpenClaw**:
   - Работает через выделенного Telegram-бота для владельца (`allowFrom: [743866013]`).
   - Поддерживает расширения, сессии, долговременную память и автоматизацию.

2. **Модель и провайдер**:
   - OpenRouter API с моделью **DeepSeek-V3** (`deepseek/deepseek-chat`).

3. **Сетевая интеграция и реестр микросервисов**:
   - Прямой доступ к сервису аренды (`accruals-accountant:3005`).
   - Прямой доступ к сервису оптовой торговли (`backend:3000`).
   - Прямой доступ к парсеру ЖКХ (`accruals-watcher:4500`).
   - Автоматическая синхронизация реестра микросервисов из `docs/SERVICES.md` в рабочую область агента `data/workspace/SERVICES.md` при каждом развертывании.

## Структура подпроекта

```text
viasglobal/openclaw/
├── .agents/
│   └── AGENTS.md                   # Правила для ИИ ассистента
├── README.md                       # Данный документ
├── Makefile                        # Команды управления (make deploy, make logs)
├── deploy.sh                       # Скрипт генерации конфигурации и запуска
├── docker-compose.yml              # Описание контейнера viasglobal-openclaw
├── .env.example                    # Шаблон переменных окружения
├── .env                            # Файл с API-ключами (не коммитится)
├── config/
│   ├── openclaw.template.json      # Шаблон конфигурации OpenClaw
│   └── workspace/
│       └── AGENTS.md               # Базовые инструкции для workspace OpenClaw
└── data/                           # Смонтированный том данных (~/.openclaw)
    └── workspace/
        ├── SERVICES.md             # Автосинхронизированный реестр API сервисов
        └── AGENTS.md               # Инструкции агента по вызовам API
```

## Развертывание

### 1. Из корня репозитория:
```bash
make deploy-openclaw
```

### 2. Прямо на сервере Huawei:
```bash
cd ~/viasglobal/openclaw
make deploy
```

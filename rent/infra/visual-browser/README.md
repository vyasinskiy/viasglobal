# Визуальный браузер (accruals-visual-browser)

Кастомный Dockerfile для удаленного браузера Chromium на базе `lscr.io/linuxserver/chromium:latest` с веб-доступом (KasmVNC/Selkies).

## Назначение патча кириллицы (`patch-selkies.py`)

В оригинальном образе LinuxServer Chromium при вводе кириллицы с внешних клавиатур (особенно macOS) ряд букв («о», «ч», «н», «ы», «х» и другие) не разрешался напрямую через активную раскладку seat. Selkies пытался отправить их через протокол `zwp_virtual_keyboard_manager_v1`, который не поддерживается оконным менеджером `labwc`, а запасной fallback на буфер обмена падал с ошибкой `Broken pipe`. В результате эти буквы безвозвратно отбрасывались.

Скрипт `patch-selkies.py` перенаправляет fallback-печать на нативную утилиту `wtype` (на сокете `wayland-0`), гарантируя 100% ввод любых кириллических символов.

## Сборка и запуск

Сборка происходит автоматически в `docker compose`:
```bash
docker compose --profile manual build visual-browser
```

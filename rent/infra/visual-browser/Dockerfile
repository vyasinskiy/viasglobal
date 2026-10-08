# Базовый образ LinuxServer Chromium с веб-доступом (KasmVNC/Selkies)
FROM lscr.io/linuxserver/chromium:latest

# Копируем скрипт патча Selkies для поддержки кириллицы
COPY patch-selkies.py /tmp/patch-selkies.py

# Применяем патч в системное Python-окружение Selkies (/lsiopy)
RUN /lsiopy/bin/python3 /tmp/patch-selkies.py && rm -f /tmp/patch-selkies.py

# Дополнительно сохраняем скрипт в custom-cont-init.d для автоматического применения при старте контейнера
RUN mkdir -p /custom-cont-init.d && \
    cp /tmp/patch-selkies.py /custom-cont-init.d/01-patch-selkies.py 2>/dev/null || true

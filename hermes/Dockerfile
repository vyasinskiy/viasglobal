# Базовый легковесный образ Python 3.11
FROM python:3.11-slim

# Установка системных зависимостей (ffmpeg для аудио, curl для healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Создание рабочей директории приложения
WORKDIR /app

# Копирование и установка Python зависимостей
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Копирование исходного кода и конфигураций
COPY config /app/config
COPY tools /app/tools
COPY src /app/src

# Создание директории данных для базы SQLite
RUN mkdir -p /app/data

# Настройка переменных окружения Python
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Команда запуска сервиса
CMD ["python", "-m", "src.main"]

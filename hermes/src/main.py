import asyncio
import io
import os
import sys
from dotenv import load_dotenv
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# Загружаем переменные окружения из .env
load_dotenv()

from src.agent import HermesAgent
from src.database import clear_conversation_history, init_db

# Считываем разрешенные Telegram ID пользователей
ALLOWED_USERS_RAW = os.environ.get("TELEGRAM_ALLOWED_USERS", "743866013")
ALLOWED_USER_IDS = set()
for uid in ALLOWED_USERS_RAW.split(","):
    cleaned = uid.strip()
    if cleaned.isdigit():
        ALLOWED_USER_IDS.add(int(cleaned))


def is_user_authorized(user_id: int) -> bool:
    """
    Проверка, имеет ли пользователь право общаться с персональным ассистентом.
    Строгий режим приватности: разрешен доступ только явно указанным ID владельца.
    """
    if not ALLOWED_USER_IDS:
        return False
    return user_id in ALLOWED_USER_IDS


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Обработчик команды /start.
    """
    user = update.effective_user
    if not user or not is_user_authorized(user.id):
        if user:
            print(f"[HermesAgent] ⛔️ Попытка /start от неавторизованного ID {user.id} (@{user.username})")
        return

    text = (
        f"👋 Привет, {user.first_name}!\n\n"
        "Я твой персональный исполнительный и финансовый AI-ассистент.\n\n"
        "Чем я могу помочь:\n"
        "• 🏠 Учет аренды: просмотр жильцов, фиксация оплат, начисления ЖКУ\n"
        "• 📦 Оптовый бизнес (Amazon Wholesale): поиск брендов и дистрибьюторов\n"
        "• 💡 Ответы на любые вопросы и поручения\n\n"
        "Команды:\n"
        "/reset - очистить текущий контекст диалога"
    )
    if update.message:
        await update.message.reply_text(text)


async def reset_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Обработчик команды /reset для сброса контекста разговора.
    """
    user = update.effective_user
    if not user or not is_user_authorized(user.id):
        return

    clear_conversation_history(user.id)
    if update.message:
        await update.message.reply_text("🔄 Контекст диалога очищен. Начинаем с чистого листа!")


async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Обработка входящих текстовых сообщений.
    """
    user = update.effective_user
    message = update.message
    if not user or not message or not message.text:
        return

    # Строгая проверка прав доступа: посторонние сообщения полностью игнорируются
    if not is_user_authorized(user.id):
        print(f"[HermesAgent] ⛔️ Игнорирование сообщения от чужого ID {user.id} (@{user.username}): {message.text[:50]}")
        return


    # Показываем статус набора текста в чате
    await context.bot.send_chat_action(chat_id=message.chat_id, action=ChatAction.TYPING)

    agent: HermesAgent = context.application.bot_data["agent"]

    # Выполняем синхронный вызов агента в отдельном потоке, чтобы не блокировать asyncio loop
    loop = asyncio.get_running_loop()
    reply_text = await loop.run_in_executor(None, agent.process_message, user.id, message.text)

    # Telegram ограничивает длину одного сообщения 4096 символами
    if len(reply_text) <= 4000:
        await message.reply_text(reply_text)
    else:
        for i in range(0, len(reply_text), 4000):
            await message.reply_text(reply_text[i:i + 4000])


# Глобальный экземпляр встроенной локальной модели Whisper
_local_whisper_model = None


def get_local_whisper():
    """
    Ленивая инициализация встроенной модели faster-whisper на CPU.
    Работает полностью локально и автономно, не требует внешних API-ключей.
    """
    global _local_whisper_model
    if _local_whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            print("[HermesAgent] Загрузка встроенной модели распознавания речи Whisper (base, int8)...")
            _local_whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            print("[HermesAgent] Встроенная модель Whisper успешно загружена!")
        except Exception as e:
            print(f"[HermesAgent] Ошибка инициализации faster-whisper: {e}")
            raise
    return _local_whisper_model


def transcribe_voice_bytes(voice_bytes: io.BytesIO) -> str:
    """
    Транскрибация голосового сообщения:
    1. Через Groq API (если задан GROQ_API_KEY)
    2. Через OpenAI API (если задан OPENAI_API_KEY)
    3. Через встроенную локальную модель faster-whisper (автономно, бесплатно)
    """
    voice_bytes.seek(0)

    # 1. Если настроен Groq API
    if os.environ.get("GROQ_API_KEY"):
        from openai import OpenAI
        client = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=os.environ.get("GROQ_API_KEY"))
        res = client.audio.transcriptions.create(model="whisper-large-v3", file=voice_bytes)
        return res.text

    # 2. Если настроен OpenAI API
    if os.environ.get("OPENAI_API_KEY"):
        from openai import OpenAI
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        res = client.audio.transcriptions.create(model="whisper-1", file=voice_bytes)
        return res.text

    # 3. Встроенная локальная модель faster-whisper
    model = get_local_whisper()
    segments, _ = model.transcribe(voice_bytes, language="ru", beam_size=5)
    return " ".join([seg.text.strip() for seg in segments if seg.text.strip()])


async def handle_voice_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Обработка голосовых сообщений от владельца.
    """
    user = update.effective_user
    message = update.message
    if not user or not message or not message.voice:
        return

    # Строгая проверка прав доступа: посторонние голосовые сообщения полностью игнорируются
    if not is_user_authorized(user.id):
        print(f"[HermesAgent] ⛔️ Игнорирование голосового от чужого ID {user.id} (@{user.username})")
        return

    await context.bot.send_chat_action(chat_id=message.chat_id, action=ChatAction.TYPING)

    try:
        # Скачиваем голосовой файл из Telegram
        voice_file = await context.bot.get_file(message.voice.file_id)
        voice_bytes = io.BytesIO()
        await voice_file.download_to_memory(voice_bytes)
        voice_bytes.seek(0)
        voice_bytes.name = "voice.ogg"

        # Выполняем транскрибацию в отдельном потоке execution loop
        loop = asyncio.get_running_loop()
        transcribed_text = await loop.run_in_executor(None, transcribe_voice_bytes, voice_bytes)

        if not transcribed_text.strip():
            await message.reply_text("Не удалось распознать речь в голосовом сообщении. Попробуйте повторить громче.")
            return

        await message.reply_text(f"🗣 Распознано: «{transcribed_text}»")

        # Передаем распознанный текст агенту для обработки и выполнения команд
        agent: HermesAgent = context.application.bot_data["agent"]
        reply_text = await loop.run_in_executor(None, agent.process_message, user.id, transcribed_text)

        # Отправляем ответ пользователю
        if len(reply_text) <= 4000:
            await message.reply_text(reply_text)
        else:
            for i in range(0, len(reply_text), 4000):
                await message.reply_text(reply_text[i:i + 4000])

    except Exception as e:
        print(f"[HermesAgent] Ошибка обработки голосового: {e}")
        await message.reply_text(f"⚠️ Ошибка обработки голосового сообщения: {str(e)}")



def main():
    """
    Точка входа запуска сервиса Hermes Agent.
    """
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        print("[HermesAgent] ⚠️ Внимание: Переменная TELEGRAM_BOT_TOKEN не задана в agent/.env!")
        print("[HermesAgent] Контейнер успешно запущен и ожидает настройки токена от @BotFather.")
        print("[HermesAgent] После внесения токена выполните 'make redeploy-agent'.")
        import time
        while True:
            time.sleep(30)

    # Инициализация базы данных SQLite

    init_db()

    # Создание экземпляра агента
    agent = HermesAgent()

    # Сборка Telegram приложения
    application: Application = ApplicationBuilder().token(bot_token).build()
    application.bot_data["agent"] = agent

    # Регистрация обработчиков
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("reset", reset_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message))
    application.add_handler(MessageHandler(filters.VOICE, handle_voice_message))

    print("[HermesAgent] Персональный ассистент успешно запущен и слушает Telegram...")
    application.run_polling()


if __name__ == "__main__":
    main()

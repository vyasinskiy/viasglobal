import json
import os
import sqlite3
from typing import Any, Dict, List, Optional

# Путь к файлу базы данных SQLite
DB_DIR = os.environ.get("DATA_DIR", "data")
DB_PATH = os.path.join(DB_DIR, "agent.db")


def init_db():
    """
    Инициализация таблиц базы данных SQLite для хранения диалогов и неподтвержденных действий.
    """
    # Создаем директорию, если она еще не создана
    os.makedirs(DB_DIR, exist_ok=True)

    # Подключаемся к базе данных
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()

        # Таблица истории сообщений диалога
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT NOT NULL,
                content TEXT,
                tool_calls TEXT,
                tool_call_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Таблица ожидающих подтверждения действий владельца
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS pending_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()


def save_message(user_id: int, role: str, content: Optional[str] = None, tool_calls: Optional[List[Dict[str, Any]]] = None, tool_call_id: Optional[str] = None):
    """
    Сохранение отдельного сообщения в историю диалога.
    """
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        tool_calls_json = json.dumps(tool_calls, ensure_ascii=False) if tool_calls else None
        cursor.execute("""
            INSERT INTO messages (user_id, role, content, tool_calls, tool_call_id)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, role, content, tool_calls_json, tool_call_id))
        conn.commit()


def get_conversation_history(user_id: int, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Получение последних N сообщений диалога для передачи в контекст языковой модели.
    """
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT role, content, tool_calls, tool_call_id
            FROM (
                SELECT id, role, content, tool_calls, tool_call_id
                FROM messages
                WHERE user_id = ?
                ORDER BY id DESC
                LIMIT ?
            ) sub
            ORDER BY id ASC
        """, (user_id, limit))
        rows = cursor.fetchall()

    history: List[Dict[str, Any]] = []
    for role, content, tool_calls_json, tool_call_id in rows:
        msg: Dict[str, Any] = {"role": role}
        if content is not None:
            msg["content"] = content
        if tool_calls_json:
            try:
                msg["tool_calls"] = json.loads(tool_calls_json)
            except Exception:
                pass
        if tool_call_id:
            msg["tool_call_id"] = tool_call_id
        history.append(msg)

    return history


def clear_conversation_history(user_id: int):
    """
    Очистка истории диалога по запросу пользователя (например, команда /reset).
    """
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM messages WHERE user_id = ?", (user_id,))
        conn.commit()

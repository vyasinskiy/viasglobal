from datetime import datetime
import json
import os
from typing import Any, Dict, List, Optional
from openai import OpenAI

from src.database import get_conversation_history, save_message
from src.tools_loader import load_tools_from_config


class HermesAgent:
    """
    Автономный агент на базе Hermes / OpenRouter с поддержкой Function Calling.
    """

    def __init__(self):
        # Чтение конфигурации из переменных окружения
        self.api_key = os.environ.get("OPENROUTER_API_KEY", "")
        self.model_name = os.environ.get("MODEL", "deepseek/deepseek-chat")
        self.base_url = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

        # Инициализация клиента OpenAI API для работы через шлюз OpenRouter
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )

        # Загрузка системного промпта
        self.system_prompt_path = os.environ.get("SYSTEM_PROMPT_PATH", "config/prompt.txt")
        self.system_prompt_template = self._load_system_prompt()

        # Динамическая загрузка доступных инструментов
        self.tools_definitions, self.tools_registry = load_tools_from_config("config/config.yaml")

    def _load_system_prompt(self) -> str:
        """
        Загрузка системного промпта из текстового файла.
        """
        try:
            with open(self.system_prompt_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception as e:
            print(f"[HermesAgent] Не удалось прочитать {self.system_prompt_path}: {e}")
            return "Ты - полезный финансовый AI-ассистент системы ViasGlobal."

    def _get_system_message(self) -> Dict[str, str]:
        """
        Формирование системного сообщения с подстановкой актуальной даты и времени.
        """
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        content = f"{self.system_prompt_template}\n\nТекущая дата и время системы: {now_str}"
        return {"role": "system", "content": content}

    def process_message(self, user_id: int, user_text: str) -> str:
        """
        Основной цикл обработки входящего сообщения пользователя с вызовами инструментов (Tool Calling).
        """
        # 1. Сохраняем входящее сообщение пользователя в базу данных
        save_message(user_id=user_id, role="user", content=user_text)

        # 2. Формируем контекст диалога: системный промпт + история
        messages: List[Dict[str, Any]] = [self._get_system_message()]
        history = get_conversation_history(user_id=user_id, limit=20)
        messages.extend(history)

        max_iterations = 6
        current_iteration = 0

        # 3. Цикл взаимодействия с LLM и выполнения инструментов
        while current_iteration < max_iterations:
            current_iteration += 1

            try:
                # Отправка запроса к OpenRouter
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    tools=self.tools_definitions if self.tools_definitions else None,
                    temperature=0.1,
                )
            except Exception as e:
                err_msg = f"Ошибка при обращении к языковой модели: {str(e)}"
                print(f"[HermesAgent] {err_msg}")
                return f"⚠️ {err_msg}"

            choice = response.choices[0]
            message = choice.message

            # Если модель запросила вызов инструментов
            if message.tool_calls:
                # Преобразуем tool_calls в сериализуемый формат
                serialized_tool_calls = [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in message.tool_calls
                ]

                # Сохраняем сообщение ассистента с запросом инструментов в БД и текущий контекст
                save_message(
                    user_id=user_id,
                    role="assistant",
                    content=message.content,
                    tool_calls=serialized_tool_calls
                )
                messages.append({
                    "role": "assistant",
                    "content": message.content,
                    "tool_calls": serialized_tool_calls
                })

                # Выполняем каждый вызванный инструмент
                for tool_call in message.tool_calls:
                    func_name = tool_call.function.name
                    func_args_str = tool_call.function.arguments
                    tool_call_id = tool_call.id

                    try:
                        args = json.loads(func_args_str) if func_args_str else {}
                    except Exception:
                        args = {}

                    print(f"[HermesAgent] Запуск инструмента {func_name} с аргументами: {args}")

                    # Поиск и выполнение функции в реестре
                    if func_name in self.tools_registry:
                        try:
                            func = self.tools_registry[func_name]
                            result = func(**args)
                            result_str = json.dumps(result, ensure_ascii=False)
                        except Exception as tool_err:
                            result_str = json.dumps({"error": f"Ошибка выполнения {func_name}: {str(tool_err)}"}, ensure_ascii=False)
                    else:
                        result_str = json.dumps({"error": f"Инструмент '{func_name}' не найден"}, ensure_ascii=False)

                    # Сохраняем результат выполнения инструмента в БД и добавляем в сообщения
                    save_message(
                        user_id=user_id,
                        role="tool",
                        content=result_str,
                        tool_call_id=tool_call_id
                    )
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call_id,
                        "content": result_str
                    })

                # Переходим на следующий шаг цикла, чтобы модель сформировала ответ на основе полученных данных
                continue

            # Если модель вернула финальный текстовый ответ
            final_text = message.content or ""
            save_message(user_id=user_id, role="assistant", content=final_text)
            return final_text

        return "Превышен лимит шагов выполнения инструментов."

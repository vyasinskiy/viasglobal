import importlib
import inspect
from typing import Any, Callable, Dict, List, Tuple, get_args, get_origin
import yaml

# Маппинг стандартных типов Python в типы JSON Schema
TYPE_MAP = {
    str: "string",
    int: "integer",
    float: "number",
    bool: "boolean",
    list: "array",
    dict: "object",
}


def python_type_to_json_type(py_type: Any) -> str:
    """
    Преобразование аннотации типа Python в строку типа JSON Schema.
    """
    # Если тип из модуля typing (например Optional[int] или Union[str, None])
    origin = get_origin(py_type)
    if origin is not None:
        args = [arg for arg in get_args(py_type) if arg is not type(None)]
        if args:
            return python_type_to_json_type(args[0])
        return "string"

    # Обычный стандартный тип
    return TYPE_MAP.get(py_type, "string")


def generate_function_schema(tool_name: str, description: str, func: Callable) -> Dict[str, Any]:
    """
    Автоматическая генерация спецификации функции OpenAI Tool на основе inspect и type hints.
    """
    # Получаем сигнатуру функции и параметры
    sig = inspect.signature(func)
    properties: Dict[str, Any] = {}
    required: List[str] = []

    # Проходим по каждому параметру функции
    for param_name, param in sig.parameters.items():
        # Определяем JSON Schema тип аргумента
        json_type = "string"
        if param.annotation != inspect.Parameter.empty:
            json_type = python_type_to_json_type(param.annotation)

        properties[param_name] = {
            "type": json_type,
            "description": f"Параметр {param_name}"
        }

        # Если значение по умолчанию отсутствует, параметр считается обязательным
        if param.default == inspect.Parameter.empty:
            required.append(param_name)

    # Формируем итоговую спецификацию функции для OpenAI Tool Calling
    return {
        "type": "function",
        "function": {
            "name": tool_name,
            "description": description or func.__doc__ or f"Инструмент {tool_name}",
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required
            }
        }
    }


def load_tools_from_config(config_path: str = "config/config.yaml") -> Tuple[List[Dict[str, Any]], Dict[str, Callable]]:
    """
    Загрузка инструментов из конфигурационного файла config.yaml.
    Возвращает список схем для вызова LLM и реестр исполняемых функций.
    """
    # Читаем конфигурацию инструментов из YAML
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    tools_definitions: List[Dict[str, Any]] = []
    tools_registry: Dict[str, Callable] = {}

    tools_list = config.get("tools", [])

    # Итерируемся по описанным инструментам и динамически импортируем их
    for item in tools_list:
        name = item.get("name")
        description = item.get("description", "")
        module_name = item.get("module")
        func_name = item.get("function")

        if not (name and module_name and func_name):
            continue

        try:
            # Динамический импорт модуля
            mod = importlib.import_module(module_name)
            # Извлечение целевой функции
            func = getattr(mod, func_name)

            # Формирование JSON Schema для модели
            schema = generate_function_schema(name, description, func)
            tools_definitions.append(schema)
            tools_registry[name] = func
        except Exception as err:
            print(f"[ToolsLoader] Не удалось загрузить инструмент '{name}' из {module_name}.{func_name}: {err}")

    return tools_definitions, tools_registry

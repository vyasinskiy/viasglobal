#!/usr/bin/env python3
"""
Скрипт сборки конфигурации OpenClaw (openclaw.json).
Объединяет базовый шаблон openclaw.template.json с модульным пресетом модели из config/models/
и подставляет секреты из переменных окружения.
"""

import os
import sys
import json
import argparse
from pathlib import Path


def normalize_preset_name(raw_name: str) -> str:
    """Нормализует имя пресета, отсекая префиксы провайдеров и расширения."""
    name = raw_name.strip()
    if name.endswith('.json'):
        name = name[:-5]
    # Если передано полное имя вида openai/gpt-6-luna или openrouter/openai/gpt-6-luna
    if '/' in name:
        name = name.split('/')[-1]
    return name


def substitute_env_vars(obj, env_vars):
    """Рекурсивно подставляет переменные окружения вида ${VAR_NAME} в JSON."""
    if isinstance(obj, str):
        for k, v in env_vars.items():
            placeholder = f"${{{k}}}"
            if placeholder in obj:
                obj = obj.replace(placeholder, v)
        return obj
    elif isinstance(obj, dict):
        return {k: substitute_env_vars(v, env_vars) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [substitute_env_vars(item, env_vars) for item in obj]
    return obj


def main():
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent

    parser = argparse.ArgumentParser(description="Сборка конфигурации OpenClaw с пресетом модели")
    parser.add_argument("--preset", default=os.getenv("MODEL", "gpt-6-luna"), help="Имя пресета модели из config/models/")
    parser.add_argument("--template", default=str(script_dir / "openclaw.template.json"), help="Путь к базовому шаблону")
    parser.add_argument("--models-dir", default=str(script_dir / "models"), help="Каталог с пресетами моделей")
    parser.add_argument("--output", default=str(base_dir / "data" / "openclaw.json"), help="Куда сохранить итоговый openclaw.json")
    args = parser.parse_args()

    models_dir = Path(args.models_dir)
    if not models_dir.exists():
        print(f"❌ Ошибка: каталог пресетов не найден: {models_dir}", file=sys.stderr)
        sys.exit(1)

    available_presets = [p.stem for p in models_dir.glob("*.json")]
    preset_name = normalize_preset_name(args.preset)

    preset_file = models_dir / f"{preset_name}.json"
    if not preset_file.exists():
        print(f"❌ Ошибка: пресет модели '{args.preset}' (нормализован: '{preset_name}') не найден!", file=sys.stderr)
        print(f"📋 Доступные пресеты в {models_dir}: {', '.join(sorted(available_presets))}", file=sys.stderr)
        sys.exit(1)

    template_file = Path(args.template)
    if not template_file.exists():
        print(f"❌ Ошибка: файл шаблона не найден: {template_file}", file=sys.stderr)
        sys.exit(1)

    # 1. Загружаем шаблон и пресет
    with open(template_file, "r", encoding="utf-8") as f:
        config = json.load(f)

    with open(preset_file, "r", encoding="utf-8") as f:
        preset = json.load(f)

    # 2. Внедряем параметры модели в конфигурацию
    provider = preset.get("provider", "openrouter")
    model_id = preset["modelId"]
    model_meta = preset["model"]

    # Инициализируем секцию models.providers
    if "models" not in config:
        config["models"] = {}
    if "providers" not in config["models"]:
        config["models"]["providers"] = {}
    if provider not in config["models"]["providers"]:
        config["models"]["providers"][provider] = {}

    config["models"]["providers"][provider]["models"] = [model_meta]

    # Настраиваем агента
    agents_defaults = config.setdefault("agents", {}).setdefault("defaults", {})
    agents_defaults["model"] = {"primary": model_id}
    agents_defaults["models"] = {model_id: {}}
    agents_defaults["modelPolicy"] = {"allow": [model_id]}

    # Компактификация и прунинг
    if "compaction" in preset:
        agents_defaults["compaction"] = preset["compaction"]
    if "contextPruning" in preset:
        agents_defaults["contextPruning"] = preset["contextPruning"]

    # 3. Подставляем переменные окружения
    env_vars = {
        "OPENROUTER_API_KEY": os.getenv("OPENROUTER_API_KEY", ""),
        "OPENCLAW_GATEWAY_TOKEN": os.getenv("OPENCLAW_GATEWAY_TOKEN", ""),
        "TELEGRAM_BOT_TOKEN": os.getenv("TELEGRAM_BOT_TOKEN", ""),
        "TELEGRAM_ALLOWED_USERS": os.getenv("TELEGRAM_ALLOWED_USERS", "743866013"),
    }

    config = substitute_env_vars(config, env_vars)

    # 4. Сохраняем результат
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"✅ Успешно собран {out_path} с пресетом модели:")
    print(f"   • Модель: {preset.get('name', preset_name)} ({model_id})")
    print(f"   • Лимит contextTokens: {model_meta.get('contextTokens', 'не задан')}")
    print(f"   • Авто-компактификация: {preset.get('compaction', {}).get('mode', 'откл')} (порог {preset.get('compaction', {}).get('maxActiveTranscriptBytes', 'нет')})")
    print(f"   • Очистка инструментов (Pruning): mode={preset.get('contextPruning', {}).get('mode', 'откл')}")


if __name__ == "__main__":
    main()

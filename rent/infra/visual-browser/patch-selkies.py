#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт патча Selkies для поддержки полноценного ввода кириллицы в виртуальном браузере Chromium.
Решает проблему, когда буквы кириллицы, не распознанные через XKB (например, «о, ч, н, ы, х»),
попадают в fallback-буфер и дропаются из-за отсутствия zwp_virtual_keyboard_manager_v1 в labwc.
Патч перенаправляет fallback-печать на нативную утилиту wtype.
"""

import sys

TARGET_FILE = "/lsiopy/lib/python3.13/site-packages/selkies/input_handler.py"

TARGET_NEEDLE = "        async with self._wl_typer_lock:"

REPLACEMENT_BLOCK = """        async with self._wl_typer_lock:
            # Нативный fallback через wtype для гарантированного ввода кириллицы
            try:
                env_w = dict(os.environ)
                env_w["WAYLAND_DISPLAY"] = "wayland-0"
                env_w["XDG_RUNTIME_DIR"] = "/config/.XDG"
                proc = await asyncio.create_subprocess_exec("wtype", "-d", "1", text, env=env_w)
                await proc.wait()
                return
            except Exception as err:
                logger_webrtc_input.debug(f"wtype typing fallback: {err}")"""


def apply_patch():
    try:
        with open(TARGET_FILE, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Ошибка чтения {TARGET_FILE}: {e}", file=sys.stderr)
        sys.exit(1)

    if 'env_w["WAYLAND_DISPLAY"] = "wayland-0"' in content:
        print("Патч уже применен ранее, повторное применение не требуется.")
        return

    if TARGET_NEEDLE not in content:
        print(f"Ошибка: Не найдена целевая строка в {TARGET_FILE}", file=sys.stderr)
        sys.exit(1)

    new_content = content.replace(TARGET_NEEDLE, REPLACEMENT_BLOCK, 1)

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(new_content)

    print("Патч Selkies wtype успешно применен!")


if __name__ == "__main__":
    apply_patch()

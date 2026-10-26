#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Универсальная утилита для безопасного чтения, поиска и инспекции файлов Excel.
Поддерживает современные форматы (.xlsx, .xlsm, .xltx) через openpyxl,
а также классические файлы (.xls) через xlrd.
Работает строго в режиме 'только чтение' без каких-либо мутаций файлов на диске.
"""

import argparse
import json
import os
import sys
import warnings
from typing import Any, Dict, Iterator, List, Optional, Tuple, Union

# Подавляем некритичные предупреждения библиотек (например, об отсутствии дефолтных стилей openpyxl)
warnings.filterwarnings("ignore")

try:
    import openpyxl
except ImportError:
    openpyxl = None

try:
    import xlrd
except ImportError:
    xlrd = None


# Функция для безопасного строкового представления значения ячейки
def format_cell_value(val: Any) -> str:
    """Приводит значение ячейки к читаемой строке, удаляя лишние пробелы по краям."""
    if val is None:
        return ""
    # Отрезаем дробную часть у целых чисел в формате float (например, 12345.0 -> 12345)
    if isinstance(val, float) and val.is_integer():
        return str(int(val))
    return str(val).strip()


# Функция преобразования буквенного обозначения колонки (например, 'A', 'Z', 'AA') в 0-базовый индекс
def col_letter_to_index(col_str: str) -> Optional[int]:
    """Преобразует буквенный индекс колонки Excel (A -> 0, B -> 1, AA -> 26) в 0-базовый индекс."""
    col_str = col_str.strip().upper()
    if not col_str.isalpha():
        return None
    res = 0
    for char in col_str:
        res = res * 26 + (ord(char) - ord('A') + 1)
    return res - 1


# Функция для преобразования числа в букву колонки (1 -> 'A', 2 -> 'B', 27 -> 'AA')
def get_column_letter(col_idx_1_based: int) -> str:
    """Возвращает буквенное обозначение колонки по её 1-базовому индексу."""
    result = ""
    n = col_idx_1_based
    while n > 0:
        n, remainder = divmod(n - 1, 26)
        result = chr(65 + remainder) + result
    return result


# Функция для сопоставления выбранных колонок с фактическими индексами строки
def resolve_column_indices(requested_cols: List[str], headers: List[str]) -> List[int]:
    """
    Определяет список 0-базовых числовых индексов колонок на основе переданных пользователем имён,
    буквенных обозначений (A, B, C) или 1-базовых номеров (1, 2, 3).
    """
    resolved: List[int] = []
    # Приводим фактические заголовки к нижнему регистру для регистронезависимого поиска
    headers_lower = [h.lower() for h in headers]

    for req in requested_cols:
        req_clean = req.strip()
        if not req_clean:
            continue

        # 1. Проверяем, является ли запрос числовым индексом (1-базовым)
        if req_clean.isdigit():
            idx = int(req_clean) - 1
            if 0 <= idx < len(headers):
                resolved.append(idx)
                continue

        # 2. Проверяем точное совпадение с именем заголовка (без учета регистра)
        req_lower = req_clean.lower()
        if req_lower in headers_lower:
            resolved.append(headers_lower.index(req_lower))
            continue

        # 3. Проверяем, является ли буквенным обозначением (например, A, B, AA)
        letter_idx = col_letter_to_index(req_clean)
        if letter_idx is not None and 0 <= letter_idx < len(headers):
            resolved.append(letter_idx)
            continue

        # 4. Проверяем частичное вхождение в заголовок
        partial_matches = [i for i, h in enumerate(headers_lower) if req_lower in h]
        if partial_matches:
            resolved.append(partial_matches[0])
            continue

        # Если колонка не найдена, выводим предупреждение в stderr
        print(f"Предупреждение: Колонка '{req_clean}' не найдена в файле.", file=sys.stderr)

    # Удаляем дубликаты индексов с сохранением порядка
    unique_resolved: List[int] = []
    for idx in resolved:
        if idx not in unique_resolved:
            unique_resolved.append(idx)
    return unique_resolved if unique_resolved else list(range(len(headers)))


# Форматирование списка строк в виде Markdown таблицы
def print_markdown_table(headers: List[str], rows: List[List[str]]) -> None:
    """Выводит данные в виде аккуратной Markdown-таблицы с выравниванием колонок."""
    if not headers and not rows:
        print("(нет данных для отображения)")
        return

    # Вычисляем максимальную ширину для каждого столбца (минимум 3 символа)
    col_widths = [max(len(h), 3) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            if i < len(col_widths):
                col_widths[i] = max(col_widths[i], len(val))

    # Формируем заголовочную строку таблицы
    header_line = "| " + " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers)) + " |"
    # Формируем разделитель заголовка таблицы
    separator_line = "|-" + "-|-".join("-" * col_widths[i] for i in range(len(col_widths))) + "-|"

    print(header_line)
    print(separator_line)

    # Выводим строки таблицы
    for row in rows:
        row_cells = []
        for i in range(len(headers)):
            val = row[i] if i < len(row) else ""
            row_cells.append(val.ljust(col_widths[i]))
        print("| " + " | ".join(row_cells) + " |")


# Универсальный адаптер для чтения строк книги Excel (абстракция над openpyxl и xlrd)
class ExcelReader:
    """Унифицированный интерфейс для чтения книг форматов .xlsx и .xls."""

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.ext = os.path.splitext(file_path)[1].lower()
        self.is_xls = self.ext == ".xls"

        if self.is_xls:
            if xlrd is None:
                raise ImportError("Для чтения файлов формата .xls требуется библиотека xlrd. Установите: pip install xlrd")
            # Открываем книгу в xlrd (режим по требованию)
            self.wb = xlrd.open_workbook(file_path, on_demand=True)
            self.sheet_names = self.wb.sheet_names()
        else:
            if openpyxl is None:
                raise ImportError("Для чтения файлов формата .xlsx требуется библиотека openpyxl. Установите: pip install openpyxl")
            # Открываем книгу в openpyxl (только значения, только чтение)
            self.wb = openpyxl.load_workbook(file_path, data_only=True, read_only=True)
            self.sheet_names = self.wb.sheetnames

    def get_sheet_info(self) -> List[Tuple[str, Union[int, str], Union[int, str]]]:
        """Возвращает информацию о всех листах книги: (имя, количество_строк, количество_колонок)."""
        info = []
        for name in self.sheet_names:
            if self.is_xls:
                sh = self.wb.sheet_by_name(name)
                info.append((name, sh.nrows, sh.ncols))
            else:
                sh = self.wb[name]
                rows = sh.max_row or "неизвестно"
                cols = sh.max_column or "неизвестно"
                info.append((name, rows, cols))
        return info

    def iter_sheet_rows(self, sheet_name: Optional[str] = None) -> Tuple[str, Iterator[List[Any]]]:
        """Возвращает кортеж (имя_листа, итератор_по_строкам_со_значениями)."""
        selected_name = sheet_name if sheet_name else self.sheet_names[0]
        if selected_name not in self.sheet_names:
            raise ValueError(f"Лист '{selected_name}' не найден. Доступные листы: {self.sheet_names}")

        if self.is_xls:
            sh = self.wb.sheet_by_name(selected_name)
            # Генератор строк для xlrd
            def xls_gen():
                for r in range(sh.nrows):
                    yield sh.row_values(r)
            return selected_name, xls_gen()
        else:
            sh = self.wb[selected_name]
            return selected_name, sh.iter_rows(values_only=True)

    def close(self):
        """Безопасное закрытие книги."""
        try:
            if hasattr(self.wb, "close"):
                self.wb.close()
            elif hasattr(self.wb, "release_resources"):
                self.wb.release_resources()
        except Exception:
            pass


# Главная функция обработки файла Excel
def inspect_excel(args: argparse.Namespace) -> None:
    """Открывает книгу Excel в режиме только для чтения и выводит данные согласно параметрам."""
    # Проверяем физическое существование файла на диске
    if not os.path.exists(args.file):
        print(f"Ошибка: Файл '{args.file}' не найден.", file=sys.stderr)
        sys.exit(1)

    # Инициализируем унифицированный адаптер чтения книги
    try:
        reader = ExcelReader(args.file)
    except Exception as e:
        print(f"Ошибка при открытии Excel файла '{args.file}': {e}", file=sys.stderr)
        sys.exit(1)

    # Обработка команды вывода списка всех листов книги
    if args.list_sheets:
        print(f"Файл: {os.path.abspath(args.file)}")
        print("Доступные листы книги:")
        for idx, (s_name, rows_cnt, cols_cnt) in enumerate(reader.get_sheet_info(), start=1):
            print(f"  {idx}. '{s_name}' (строк: {rows_cnt}, колонок: {cols_cnt})")
        reader.close()
        return

    # Получаем итератор по строкам выбранного листа
    try:
        active_sheet_name, row_iter = reader.iter_sheet_rows(args.sheet)
    except Exception as e:
        print(f"Ошибка: {e}", file=sys.stderr)
        reader.close()
        sys.exit(1)

    # Читаем строки до строки с заголовками
    current_row_idx = 0
    raw_headers: List[str] = []

    # Если пользователь явно не указал header-row, мы ищем первую непустую строку с данными
    header_target_row = args.header_row if args.header_row is not None else 1

    for row in row_iter:
        current_row_idx += 1
        if current_row_idx == header_target_row:
            raw_headers = [format_cell_value(c) for c in row]
            break

    # Если строка заголовков не найдена
    if not raw_headers:
        print(f"Внимание: Не удалось прочитать заголовки в строке {header_target_row}.", file=sys.stderr)
        reader.close()
        return

    # Заменяем пустые заголовки на Col_1, Col_2 и т.д.
    headers = [h if h else f"Col_{i+1}" for i, h in enumerate(raw_headers)]

    # Если запрошен вывод только заголовков таблицы
    if args.headers_only:
        print(f"Лист: '{active_sheet_name}' (строка заголовков: {header_target_row})")
        print(f"Всего столбцов: {len(headers)}")
        for idx, h in enumerate(headers, start=1):
            letter = get_column_letter(idx)
            print(f"  [{letter} / #{idx}] {h}")
        reader.close()
        return

    # Разрешаем индексы столбцов, если передан параметр --columns
    if args.columns:
        requested_list = [c.strip() for c in args.columns.split(",") if c.strip()]
        selected_col_indices = resolve_column_indices(requested_list, headers)
    else:
        selected_col_indices = list(range(len(headers)))

    # Выбираем отфильтрованные заголовки для отображения
    display_headers = [headers[i] for i in selected_col_indices]

    # Поиск и фильтрация строк
    matched_rows: List[Tuple[int, List[str]]] = []
    search_query = args.search.lower() if args.search else None

    # Читаем данные построчно (потоково для экономии памяти)
    for row in row_iter:
        current_row_idx += 1
        str_cells = [format_cell_value(c) for c in row]

        # Дополняем строку пустыми значениями до количества заголовков, если строка короче
        if len(str_cells) < len(headers):
            str_cells.extend([""] * (len(headers) - len(str_cells)))

        # Если запрошена конкретная строка по номеру (--row N)
        if args.row is not None:
            if current_row_idx == args.row:
                matched_rows.append((current_row_idx, str_cells))
                break
            continue

        # Проверяем условие поиска: ищем поисковую подстроку в любых ячейках текущей строки
        if search_query:
            row_text = " ".join(str_cells).lower()
            if search_query not in row_text:
                continue

        # Если строка подходит под критерии фильтра
        matched_rows.append((current_row_idx, str_cells))

        # Если не задан поиск, а просто просмотр, останавливаемся при достижении лимита с учетом смещения
        if not search_query and len(matched_rows) >= (args.offset + args.limit):
            break

    # Закрываем файл книги
    reader.close()

    # Применяем сдвиг (offset) и ограничение количества строк (limit)
    if args.row is None:
        total_matched = len(matched_rows)
        sliced_rows = matched_rows[args.offset : args.offset + args.limit if args.limit > 0 else None]
    else:
        total_matched = len(matched_rows)
        sliced_rows = matched_rows

    if not sliced_rows:
        if args.search:
            print(f"Ничего не найдено по запросу '{args.search}' на листе '{active_sheet_name}'.")
        elif args.row is not None:
            print(f"Строка #{args.row} не найдена на листе '{active_sheet_name}'.")
        else:
            print(f"На листе '{active_sheet_name}' нет строк с данными.")
        return

    # Вывод результатов в формате JSON
    if args.format == "json":
        json_output = []
        for r_num, row_data in sliced_rows:
            obj: Dict[str, Any] = {"_row": r_num}
            for idx in selected_col_indices:
                col_name = headers[idx]
                val = row_data[idx] if idx < len(row_data) else ""
                obj[col_name] = val
            json_output.append(obj)
        print(json.dumps(json_output, ensure_ascii=False, indent=2))
        return

    # Вывод результатов в вертикальном формате (Key: Value) — идеально для детального просмотра строки
    if args.format == "vertical" or (args.row is not None and args.format != "json"):
        for r_num, row_data in sliced_rows:
            print(f"=== Строка #{r_num} (Лист: '{active_sheet_name}') ===")
            for idx in selected_col_indices:
                col_name = headers[idx]
                val = row_data[idx] if idx < len(row_data) else ""
                print(f"  {col_name}: {val}")
            print("-" * 50)
        return

    # Вывод результатов в формате Markdown таблицы (по умолчанию)
    table_data: List[List[str]] = []
    final_headers = ["#Row"] + display_headers

    for r_num, row_data in sliced_rows:
        row_filtered = [str(r_num)] + [row_data[i] if i < len(row_data) else "" for i in selected_col_indices]
        table_data.append(row_filtered)

    print(f"Лист: '{active_sheet_name}' | Отображено строк: {len(sliced_rows)} из {total_matched}")
    print_markdown_table(final_headers, table_data)


# Точка входа в скрипт и парсинг аргументов командной строки
def main() -> None:
    """Парсер аргументов командной строки."""
    parser = argparse.ArgumentParser(
        description="Универсальный безопасный инструмент чтения и поиска в файлах Excel (.xlsx, .xls)."
    )
    # Обязательный путь к файлу Excel
    parser.add_argument("file", help="Путь к файлу Excel (.xlsx, .xlsm, .xls)")

    # Выбор листа
    parser.add_argument("-s", "--sheet", help="Имя листа (по умолчанию первый/активный лист)")
    parser.add_argument("--list-sheets", action="store_true", help="Вывести список всех листов книги с их размерами")

    # Поиск и фильтрация
    parser.add_argument("-q", "--search", help="Универсальный поиск подстроки по всем ячейкам строки (регистронезависимо)")
    parser.add_argument("-r", "--row", type=int, help="Показать конкретную строку по её номеру (1-базовый индекс)")

    # Управление столбцами
    parser.add_argument("-c", "--columns", help="Список колонок через запятую (имена, буквы A/B/C или индексы 1/2/3)")
    parser.add_argument("--headers-only", action="store_true", help="Вывести только список заголовков столбцов")
    parser.add_argument("--header-row", type=int, default=1, help="Номер строки с заголовками (по умолчанию: 1)")

    # Пагинация и ограничения
    parser.add_argument("-n", "--limit", type=int, default=20, help="Максимальное число выводимых строк (по умолчанию: 20)")
    parser.add_argument("--offset", type=int, default=0, help="Количество строк для пропуска от начала (по умолчанию: 0)")

    # Формат вывода
    parser.add_argument(
        "-f",
        "--format",
        choices=["table", "vertical", "json"],
        default="table",
        help="Формат вывода данных: table (Markdown таблица), vertical (Ключ-значение), json (JSON массив)",
    )

    args = parser.parse_args()
    inspect_excel(args)


if __name__ == "__main__":
    main()

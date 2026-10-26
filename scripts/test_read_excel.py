#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тесты для универсальной утилиты чтения файлов Excel (scripts/read_excel.py).
Проверяют корректность извлечения данных, работу поиска, фильтрацию колонок и форматирование.
"""

import os
import sys
import unittest
from io import StringIO
from unittest.mock import patch

# Добавляем корневую директорию проекта в sys.path для корректного импорта скрипта
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.read_excel import col_letter_to_index, format_cell_value, resolve_column_indices


class TestReadExcel(unittest.TestCase):
    """Набор тестов для проверки функций модуля read_excel."""

    def test_преобразование_буквенных_индексов_колонок_в_числовые(self):
        """Проверяет преобразование букв колонок Excel (A, B, Z, AA) в 0-базовый индекс."""
        self.assertEqual(col_letter_to_index("A"), 0)
        self.assertEqual(col_letter_to_index("B"), 1)
        self.assertEqual(col_letter_to_index("Z"), 25)
        self.assertEqual(col_letter_to_index("AA"), 26)
        self.assertEqual(col_letter_to_index("AB"), 27)
        self.assertIsNone(col_letter_to_index("123"))

    def test_форматирование_значений_ячеек(self):
        """Проверяет корректное строковое приведение значений ячеек и очистку от лишних пробелов."""
        self.assertEqual(format_cell_value(None), "")
        self.assertEqual(format_cell_value("  Текст с пробелами  "), "Текст с пробелами")
        self.assertEqual(format_cell_value(12345), "12345")
        self.assertEqual(format_cell_value(12.34), "12.34")

    def test_разрешение_колонок_по_имени_номеру_и_букве(self):
        """Проверяет гибкий выбор колонок по имени, 1-базовому номеру и буквенному коду."""
        headers = ["Артикул", "Название", "Цена", "Остаток"]

        # Поиск по точному названию без учета регистра
        indices = resolve_column_indices(["артикул", "цена"], headers)
        self.assertEqual(indices, [0, 2])

        # Поиск по 1-базовому номеру столбца
        indices_num = resolve_column_indices(["1", "4"], headers)
        self.assertEqual(indices_num, [0, 3])

        # Поиск по буквенному коду колонки (A = 0, B = 1)
        indices_letter = resolve_column_indices(["A", "B"], headers)
        self.assertEqual(indices_letter, [0, 1])

        # Поиск по частичному совпадению названия
        indices_partial = resolve_column_indices(["назв"], headers)
        self.assertEqual(indices_partial, [1])

    def test_реальный_файл_safta_поиск_рюкзака_по_ean(self):
        """Эталонный тест на реальном снапшоте Safta: проверка поиска и точных данных товара по EAN."""
        excel_path = "contractors/safta/keepa_export_safta_all_eans.xlsx"
        if not os.path.exists(excel_path):
            self.skipTest(f"Тестовый файл '{excel_path}' отсутствует.")

        from scripts.read_excel import inspect_excel
        import argparse

        # Настраиваем аргументы для точечного поиска EAN рюкзака
        args = argparse.Namespace(
            file=excel_path,
            sheet=None,
            list_sheets=False,
            search="8412688670376",
            row=None,
            columns="Title,ASIN,Product Codes: EAN,Buy Box: Current,Item: Dimension (cm³),Item: Weight (g)",
            headers_only=False,
            header_row=1,
            limit=10,
            offset=0,
            format="json"
        )

        # Перехватываем вывод в stdout
        captured_output = StringIO()
        with patch("sys.stdout", captured_output):
            inspect_excel(args)

        output_str = captured_output.getvalue()
        self.assertIn("B0HFKQJRYD", output_str)
        self.assertIn("8412688670376", output_str)
        self.assertIn("Safta K-POP DEMON HUNTERS CHIBI", output_str)

    def test_реальный_файл_safta_xls_поиск_по_ean(self):
        """Эталонный тест на реальном .xls прайс-листе Safta через xlrd: проверка габаритов и цены."""
        xls_path = "contractors/safta/TARIFA.CAT SEPT 300626 xls.xls"
        if not os.path.exists(xls_path):
            self.skipTest(f"Тестовый файл '{xls_path}' отсутствует.")

        from scripts.read_excel import inspect_excel
        import argparse

        args = argparse.Namespace(
            file=xls_path,
            sheet=None,
            list_sheets=False,
            search="8412688670376",
            row=None,
            columns="DESCRIPCION,PRECIO,CODIGO BARRAS,ANCHO,ALTO,FONDO,PESO",
            headers_only=False,
            header_row=7,
            limit=5,
            offset=0,
            format="json"
        )

        captured_output = StringIO()
        with patch("sys.stdout", captured_output):
            inspect_excel(args)

        output_str = captured_output.getvalue()
        self.assertIn("8412688670376", output_str)
        self.assertIn("5.11", output_str)
        self.assertIn("27", output_str)
        self.assertIn("33", output_str)


if __name__ == "__main__":
    unittest.main()

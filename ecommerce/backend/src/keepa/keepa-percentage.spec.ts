/**
 * Модульные тесты для функции парсинга процентов Keepa (parseKeepaPercentage).
 * Проверяют корректное преобразование процентов из различных форматов выгрузок Keepa
 * (Excel дроби, готовые проценты, строки со знаком %, специальные значения -1).
 */

import { parseKeepaPercentage } from '../../scripts/parse-keepa';

describe('Функция parseKeepaPercentage (парсинг процентов Keepa)', () => {
  describe('Парсинг десятичных дробей Excel (формат от 0.0 до 1.0)', () => {
    it('число 1 (100% OOS в Excel) должно преобразовываться в 100', () => {
      // В Excel ячейка со 100% хранится как число 1.0. Функция должна вернуть 100.
      expect(parseKeepaPercentage(1)).toBe(100);
      expect(parseKeepaPercentage(1.0)).toBe(100);
    });

    it('дробь 0.56 (56% OOS в Excel) должна преобразовываться в 56', () => {
      // 56% в Excel хранится как 0.56
      expect(parseKeepaPercentage(0.56)).toBe(56);
    });

    it('дробь 0.01 (1% в Excel) должна преобразовываться в 1', () => {
      // 1% в Excel хранится как 0.01
      expect(parseKeepaPercentage(0.01)).toBe(1);
    });

    it('число 0 (0% в Excel) должно оставаться 0', () => {
      // 0% должно быть 0
      expect(parseKeepaPercentage(0)).toBe(0);
    });

    it('дробь 0.95 (95% OOS в Excel) должна преобразовываться в 95', () => {
      expect(parseKeepaPercentage(0.95)).toBe(95);
    });
  });

  describe('Парсинг целых чисел от 0 до 100', () => {
    it('число 100 должно оставаться 100', () => {
      expect(parseKeepaPercentage(100)).toBe(100);
    });

    it('число 50 должно оставаться 50', () => {
      expect(parseKeepaPercentage(50)).toBe(50);
    });

    it('число 2 должно оставаться 2', () => {
      // Значения > 1 трактуются как уже готовые проценты
      expect(parseKeepaPercentage(2)).toBe(2);
    });
  });

  describe('Парсинг строковых значений со знаком процента', () => {
    it('строка "100%" должна преобразовываться в 100', () => {
      expect(parseKeepaPercentage('100%')).toBe(100);
      expect(parseKeepaPercentage(' 100% ')).toBe(100);
    });

    it('строка "56%" должна преобразовываться в 56', () => {
      expect(parseKeepaPercentage('56%')).toBe(56);
    });

    it('строка "1%" должна преобразовываться в 1 (не 100)', () => {
      // Явный знак % указывает, что число уже в шкале 0..100
      expect(parseKeepaPercentage('1%')).toBe(1);
    });

    it('строка "0%" должна преобразовываться в 0', () => {
      expect(parseKeepaPercentage('0%')).toBe(0);
    });
  });

  describe('Парсинг строковых чисел без знака процента', () => {
    it('строка "1" (Excel число в строковом виде) должна преобразовываться в 100', () => {
      expect(parseKeepaPercentage('1')).toBe(100);
      expect(parseKeepaPercentage('1.0')).toBe(100);
    });

    it('строка "0.56" должна преобразовываться в 56', () => {
      expect(parseKeepaPercentage('0.56')).toBe(56);
    });

    it('строка "85" должна преобразовываться в 85', () => {
      expect(parseKeepaPercentage('85')).toBe(85);
    });
  });

  describe('Обработка пустых, некорректных и специальных значений', () => {
    it('значение -1 (флаг Keepa об отсутствии данных) должно возвращать null', () => {
      expect(parseKeepaPercentage(-1)).toBeNull();
      expect(parseKeepaPercentage('-1')).toBeNull();
    });

    it('пустые значения (null, undefined, пустая строка) должны возвращать null', () => {
      expect(parseKeepaPercentage(null)).toBeNull();
      expect(parseKeepaPercentage(undefined)).toBeNull();
      expect(parseKeepaPercentage('')).toBeNull();
      expect(parseKeepaPercentage('   ')).toBeNull();
    });

    it('нечисловые строки должны возвращать null', () => {
      expect(parseKeepaPercentage('abc')).toBeNull();
    });
  });
});

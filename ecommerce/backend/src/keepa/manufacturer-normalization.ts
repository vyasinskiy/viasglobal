/**
 * Вспомогательная функция очистки невидимых символов и пробелов
 */
function cleanString(str: any): string | null {
  if (str === null || str === undefined) return null;
  const s = String(str).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  return s.length > 0 ? s : null;
}

/**
 * Нормализует и очищает название производителя из выгрузок Keepa:
 * 1. Очищает невидимые символы и приводит строку к верхнему регистру (UPPERCASE).
 * 2. Удаляет технические вендор-коды Amazon в скобках на конце строки (например "(COFB0)", "(MAMQ3)", "(CES7F)").
 *    Вендор-коды Vendor Central Amazon состоят из букв и цифр (напр. COFB0) либо служебных кодов.
 * 3. Не удаляет транскрипции названий (напр. "ゼブラ(ZEBRA)") и географические указатели (напр. "(SPAIN)", "(CHINA)").
 * 4. Унифицирует организационно-правовые формы компаний на конце названия к единому эталону:
 *    - S.L. / SL / S.L -> ", S.L."
 *    - S.L.U. / SLU / S.L.U -> ", S.L.U."
 *    - S.A. / SA / S.A -> ", S.A."
 *    - S.A.U. / SAU / S.A.U -> ", S.A.U."
 *    - S.R.L. / SRL -> ", S.R.L."
 *    - B.V. / BV -> " B.V."
 *    - GMBH -> " GMBH"
 * 5. Удаляет повторяющиеся пробелы и висячие знаки препинания.
 *
 * @param str Исходная строка производителя из выгрузки Keepa
 * @returns Нормализованное название производителя или null
 */
export function normalizeManufacturerName(str: string | undefined | null): string | null {
  const clean = cleanString(str);
  if (!clean) return null;

  let s = clean.toUpperCase();

  // 1. Удаляем вендор-коды и служебные суффиксы Amazon в круглых скобках в конце строки
  s = s.replace(/\s*\(([A-Z0-9]*\d[A-Z0-9]*|DUNMR|3PL)\)$/i, '');

  // 2. Унифицируем организационно-правовые формы компаний в конце названия
  const legalForms: Array<{ regex: RegExp; replacement: string }> = [
    // S.L.U. / SLU
    { regex: /[,.]?\s*\b(S\.?L\.?U\.?|SLU)\b\.?$/i, replacement: ', S.L.U.' },
    // S.L. / SL
    { regex: /[,.]?\s*\b(S\.?L\.?|SL)\b\.?$/i, replacement: ', S.L.' },
    // S.A.U. / SAU
    { regex: /[,.]?\s*\b(S\.?A\.?U\.?|SAU)\b\.?$/i, replacement: ', S.A.U.' },
    // S.A. / SA
    { regex: /[,.]?\s*\b(S\.?A\.?|SA)\b\.?$/i, replacement: ', S.A.' },
    // S.R.L. / SRL
    { regex: /[,.]?\s*\b(S\.?R\.?L\.?|SRL)\b\.?$/i, replacement: ', S.R.L.' },
    // B.V. / BV
    { regex: /[,.]?\s*\b(B\.?V\.?|BV)\b\.?$/i, replacement: ' B.V.' },
    // GMBH
    { regex: /[,.]?\s*\b(GMBH)\b\.?$/i, replacement: ' GMBH' },
  ];

  for (const { regex, replacement } of legalForms) {
    if (regex.test(s)) {
      const base = s.replace(regex, '').trim();
      // Заменяем суффикс только если до него остается реальное название компании (от 2 символов)
      if (base.length >= 2) {
        s = `${base.replace(/[,.]+$/, '').trim()}${replacement}`;
      }
      break;
    }
  }

  // 3. Убираем двойные пробелы и пробелы по краям
  s = s.replace(/\s+/g, ' ').trim();

  return s || null;
}

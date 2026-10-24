/**
 * Грамматический анализатор для испанского языка (Viaslangs)
 * 
 * Данный модуль анализирует форму слова, русский перевод и прикрепленные теги:
 * 1. Определяет грамматическое время (Pretérito Indefinido, Pretérito Imperfecto и др.) из тегов слова.
 * 2. Извлекает лицо и число (yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes)
 *    из скобок в русском переводе карточки, которые формируются сид-скриптами спряжений.
 * 3. Распознает инфинитив и общие лексические единицы при отсутствии спряжений.
 */

export interface GrammarAnalysis {
  /** Название грамматического времени (например, "Pretérito Indefinido" или null) */
  tense: string | null;
  /** Символический код лица (yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes, infinitivo, general) */
  person: string;
  /** Человекочитаемое описание лица на русском языке */
  personLabel: string;
  /** Признак глагольной формы */
  isVerb: boolean;
  /** Список всех тегов слова */
  tags: string[];
}

/**
 * Анализирует русское описание слова и его теги для определения времени и грамматической формы лица.
 *
 * @param russian - русский перевод карточки (например: "зачислил (он / Вы)", "принял (я)")
 * @param english - целевое слово на испанском языке (например: "abonó", "acepté")
 * @param tags - массив названий тегов, привязанных к слову
 * @returns результат грамматического анализа GrammarAnalysis
 */
export function parseWordGrammar(
  russian: string = "",
  english: string = "",
  tags: string[] = []
): GrammarAnalysis {
  const normRu = russian.toLowerCase().trim();
  const normEn = english.toLowerCase().trim();

  // 1. Поиск тега времени среди привязанных тегов слова
  const knownTenses = [
    "Pretérito Indefinido",
    "Pretérito Imperfecto",
    "Presente",
    "Futuro",
    "Condicional",
    "Pretérito Perfecto",
    "Subjuntivo",
  ];

  let detectedTense: string | null = null;
  for (const tenseName of knownTenses) {
    if (tags.some((t) => t.toLowerCase() === tenseName.toLowerCase())) {
      detectedTense = tenseName;
      break;
    }
  }

  // 2. Определение грамматического лица по маркеру в скобках русского перевода
  let person = "general";
  let personLabel = "Общая форма / лексика";
  let isVerb = tags.some((t) => t.toLowerCase() === "глаголы");

  // Проверка 1-го лица единственного числа: (я)
  if (/\(я\)/.test(normRu)) {
    person = "yo";
    personLabel = "1-е лицо ед. ч. (yo)";
    isVerb = true;
  }
  // Проверка 2-го лица единственного числа: (ты)
  else if (/\(ты\)/.test(normRu)) {
    person = "tú";
    personLabel = "2-е лицо ед. ч. (tú)";
    isVerb = true;
  }
  // Проверка 3-го лица единственного числа: (он / Вы), (он/она/Вы), (он / она / Вы), (он)
  else if (/\(он\s*[\/\\]?\s*(?:она\s*[\/\\]?\s*)?вы\)/.test(normRu) || /\(он\)/.test(normRu)) {
    person = "él/ella/usted";
    personLabel = "3-е лицо ед. ч. (él/ella/usted)";
    isVerb = true;
  }
  // Проверка 1-го лица множественного числа: (мы)
  else if (/\(мы\)/.test(normRu)) {
    person = "nosotros";
    personLabel = "1-е лицо мн. ч. (nosotros)";
    isVerb = true;
  }
  // Проверка 2-го лица множественного числа: (вы)
  else if (/\(вы\)/.test(normRu)) {
    person = "vosotros";
    personLabel = "2-е лицо мн. ч. (vosotros)";
    isVerb = true;
  }
  // Проверка 3-го лица множественного числа: (они / Вы), (они/Вы), (они)
  else if (/\(они\s*[\/\\]?\s*вы\)/.test(normRu) || /\(они\)/.test(normRu)) {
    person = "ellos/ellas/ustedes";
    personLabel = "3-е лицо мн. ч. (ellos/ellas/ustedes)";
    isVerb = true;
  }
  // Если явных скобок нет, проверяем инфинитив испанского глагола
  else if (isVerb || /(?:ar|er|ir)$/.test(normEn)) {
    if (!normEn.includes(" ")) {
      person = "infinitivo";
      personLabel = "Инфинитив (начальная форма)";
      isVerb = true;
    }
  }

  return {
    tense: detectedTense,
    person,
    personLabel,
    isVerb,
    tags,
  };
}

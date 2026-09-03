/**
 * Словарь сопоставления ключевых слов из URL и заголовков коллекций с тематическими тегами магазина
 */
const TAG_DICTIONARY: Record<string, string[]> = {
  beach: ["playa", "verano", "beach", "summer"],
  playa: ["playa", "verano"],
  summer: ["verano", "playa", "summer"],
  verano: ["verano", "playa"],
  backtoschool: ["colegio", "escuela", "vuelta-al-cole", "papeleria"],
  school: ["colegio", "escuela", "vuelta-al-cole"],
  colegio: ["colegio", "escuela", "vuelta-al-cole"],
  navidad: ["navidad", "regalos", "fiestas"],
  christmas: ["navidad", "regalos", "fiestas"],
  kitchen: ["cocina", "hogar"],
  cocina: ["cocina", "hogar"],
  kids: ["infantil", "ninos"],
  ninos: ["infantil", "ninos"],
  halloween: ["halloween", "fiestas", "disfraces", "otono"],
  valentin: ["san-valentin", "regalos", "amor"],
  saintvalentin: ["san-valentin", "regalos", "amor"],
  sanvalentin: ["san-valentin", "regalos", "amor"],
  pourelle: ["para-ella", "mujer", "regalos"],
  pourlui: ["para-el", "hombre", "regalos"],
  workspace: ["oficina", "escritorio", "ergonomia"],
  office: ["oficina", "escritorio"],
};

/**
 * Автоматическое определение и нормализация тегов для подборки
 * @param url Ссылка на коллекцию / подборку
 * @param explicitTags Теги, явно переданные пользователем (имеют высший приоритет)
 * @param pageTitle Заголовок страницы коллекции (если доступен)
 */
export function extractCollectionTags(
  url: string,
  explicitTags?: string[],
  pageTitle?: string
): string[] {
  const tagsSet = new Set<string>();

  // 1. Добавляем явно указанные пользователем теги
  if (explicitTags && explicitTags.length > 0) {
    for (const tag of explicitTags) {
      const clean = tag.trim().toLowerCase();
      if (clean) tagsSet.add(clean);
    }
  }

  // 2. Автоматическое извлечение ключевых слов из URL подборки
  try {
    const parsed = new URL(url);
    const slugParts = parsed.pathname.toLowerCase().split(/[/_-]/).filter(Boolean);

    for (const part of slugParts) {
      // Ищем совпадения в словаре
      for (const [keyword, associatedTags] of Object.entries(TAG_DICTIONARY)) {
        if (part.includes(keyword)) {
          associatedTags.forEach((t) => tagsSet.add(t));
        }
      }
    }
  } catch {
    // Игнорируем ошибки парсинга URL
  }

  // 3. Автоматическое извлечение из заголовка страницы (если передан)
  if (pageTitle) {
    const words = pageTitle.toLowerCase().split(/[\s,.-]+/).filter(Boolean);
    for (const word of words) {
      for (const [keyword, associatedTags] of Object.entries(TAG_DICTIONARY)) {
        if (word === keyword || word.includes(keyword)) {
          associatedTags.forEach((t) => tagsSet.add(t));
        }
      }
    }
  }

  return Array.from(tagsSet);
}

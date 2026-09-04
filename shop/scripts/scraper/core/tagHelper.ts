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
  kids: ["infantil", "ninos", "juguetes"],
  ninos: ["infantil", "ninos", "juguetes"],
  kidult: ["ninos", "infantil", "juguetes", "juegos", "kidult"],
  juguetes: ["ninos", "infantil", "juguetes", "juegos"],
  halloween: ["halloween", "fiestas", "disfraces", "otono"],
  valentin: ["san-valentin", "regalos", "amor"],
  saintvalentin: ["san-valentin", "regalos", "amor"],
  sanvalentin: ["san-valentin", "regalos", "amor"],
  pourelle: ["para-ella", "mujer", "regalos"],
  pourlui: ["para-el", "hombre", "regalos"],
  easter: ["pascua", "primavera", "decoracion"],
  paques: ["pascua", "primavera", "decoracion"],
  pascua: ["pascua", "primavera", "decoracion"],
  primavera: ["primavera", "flores", "decoracion"],
  motherday: ["dia-de-la-madre", "madre", "regalos", "para-ella"],
  madre: ["dia-de-la-madre", "madre", "regalos", "para-ella"],
  message: ["regalos-con-mensaje", "mensajes", "regalos"],
  "10euros": ["menos-de-10", "regalos-economicos", "baratos", "regalos"],
  cadeaux: ["regalos", "detalles"],
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

/**
 * Автоматическое определение категориальных тегов (hogar, papeleria, ninos, moda, tecnologia)
 * на основе названия и описания товара
 */
export function detectProductCategoryTags(title: string, description?: string): string[] {
  const text = `${title} ${description || ""}`.toLowerCase();
  const catTags = new Set<string>();

  // 1. Канцелярия и офис
  if (text.match(/cuaderno|libreta|agenda|bolígrafo|boligrafo|rotulador|tijeras|sacapuntas|estuche|papelería|papeleria|lapiz|lápiz|clip|portalápices|oficina|organizador de escritorio|bloc|marcapáginas|notas adhesivas|marcador|pluma/)) {
    catTags.add("papeleria-creatividad");
    catTags.add("papeleria");
  }

  // 2. Дети, игрушки и игры
  if (text.match(/niño|niña|infantil|juguete|juego|dinosaurio|peluche|bebé|bebe|guardería|guarderia|educativo|marioneta|puzzle|creativo|manualidades|bádminton|kidult|plastilina|puzzles|dragon ball|muñeca|construcción/)) {
    catTags.add("ninos-juegos");
    catTags.add("juguetes");
  }

  // 3. Дом, кухня и декор
  if (text.match(/taza|vaso|plato|porcelana|cerámica|ceramica|vela|manta|cojín|cojin|fouta|toalla|decoración|decoracion|botella|lonchera|bocadillos|cocina|hogar|mesa|jarrón|jarron|cuadro|espejo|tapiz|aroma|difusor|florero|incienso|vajilla|maceta/)) {
    catTags.add("hogar-decoracion");
    catTags.add("hogar");
  }

  // 4. Мода, аксессуары и красота
  if (text.match(/bolso|tote|neceser|pañuelo|joya|pin |pines|alfiler|calcetín|calcetines|jabón|jabon|perfume|belleza|bikini|bañador|baño|mochila|llavero|cosmética|cosmetica|joyería|joyeria|pendientes|pulsera|anillo/)) {
    catTags.add("moda-accesorios");
    catTags.add("accesorios");
  }

  // 5. Технологии и гаджеты
  if (text.match(/cargador|cable|led|lámpara|lampara|usb|batería|bateria|tecnología|tecnologia|gadget|bluetooth|altavoz|auricular|reloj|smart|electrónica|electronica|inalámbrico|inalambrico/)) {
    catTags.add("tecnologia-gadgets");
  }

  // Если ничего не подошло, относим к домашнему стилю жизни
  if (catTags.size === 0) {
    catTags.add("hogar-decoracion");
    catTags.add("hogar");
  }

  return Array.from(catTags);
}

export function normalize(str: any): string {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getSignificantWords(str: string): string[] {
  const stopWords = new Set(['llc', 'inc', 'gmbh', 'ltd', 'limited', 'international', 'espana', 'spain', 'uk', 'usa', 'global', 'store', 'shop', 'direct', 'co', 'corp', 'corporation', 'sl', 'srl']);
  return str.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
}

function hasCommonWord(str1: string, str2: string): boolean {
  const words1 = getSignificantWords(str1);
  const words2 = getSignificantWords(str2);
  for (const w1 of words1) {
    if (words2.includes(w1)) return true;
  }
  return false;
}

export function getFilterReason(seller: string, brand: string, manufacturer: string): string | null {
  if (!seller) return null; // Если Buy Box пуст, считаем безопасным
  
  const normSeller = normalize(seller);
  const normBrand = normalize(brand);
  const normManuf = normalize(manufacturer);
  
  // Если продавец сам Amazon - конкурировать тоже бесполезно
  if (normSeller.includes('amazon')) return 'Amazon';
  
  // Проверяем прямое вхождение
  if (normBrand && normBrand.length > 2) {
    if (normSeller.includes(normBrand) || normBrand.includes(normSeller)) return 'Brand Match (Substring)';
  }
  
  if (normManuf && normManuf.length > 2) {
    if (normSeller.includes(normManuf) || normManuf.includes(normSeller)) return 'Manufacturer Match (Substring)';
  }
  
  // Проверяем пересечение общих корней/слов (например, bms espana и bms international)
  if (hasCommonWord(normSeller, normBrand)) return 'Brand Match (Common Root)';
  if (hasCommonWord(normSeller, normManuf)) return 'Manufacturer Match (Common Root)';
  
  return null;
}

export function isBrandOrAmazonSelling(seller: string, brand: string, manufacturer: string): boolean {
  return getFilterReason(seller, brand, manufacturer) !== null;
}

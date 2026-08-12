export function normalize(str: any): string {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isBrandOrAmazonSelling(seller: string, brand: string, manufacturer: string): boolean {
  if (!seller) return false; // Если Buy Box пуст, считаем безопасным
  
  const normSeller = normalize(seller);
  const normBrand = normalize(brand);
  const normManuf = normalize(manufacturer);
  
  // Если продавец сам Amazon - конкурировать тоже бесполезно
  if (normSeller.includes('amazon')) return true;
  
  // Проверяем совпадения с брендом
  if (normBrand && normBrand.length > 2) {
    if (normSeller.includes(normBrand) || normBrand.includes(normSeller)) return true;
  }
  
  // Проверяем совпадения с производителем
  if (normManuf && normManuf.length > 2) {
    if (normSeller.includes(normManuf) || normManuf.includes(normSeller)) return true;
  }
  
  return false;
}

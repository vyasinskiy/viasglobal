/**
 * Селекторы и константы структуры страниц Ankorstore
 */
export const ANKORSTORE_SELECTORS = {
  // Селекторы для закрытия баннеров куки и всплывающих окон
  cookieAcceptButton: [
    "#axeptio_btn_acceptAll",
    "button[data-testid='cookie-accept']",
    "button:has-text('Aceptar todas')",
    "button:has-text('Aceptar')",
    "button:has-text('Accept all')",
  ],

  // Селекторы для закрытия модальных окон авторизации / регистрации
  authPopinCloseButton: [
    "button[aria-label='Cerrar']",
    "button[aria-label='Close']",
    ".auth-popin-close",
    "button:has(.icon-x)",
    "[data-testid='modal-close-button']",
  ],

  // Карточки товаров в каталоге
  productCard: "article, [data-testid='product-card'], .card-product",

  // Ссылки на детальные карточки товаров (/brand/{brand-slug}/{product-slug})
  productLinkRegex: /\/brand\/[a-z0-9-]+(?:\/[a-z0-9-]+)+/,

  // Резервные DOM-селекторы на случай отсутствия JSON-LD
  productTitle: "h1, [data-testid='product-title']",
  productPrice: ".card-product__price, [data-testid='price'], div:has-text('PVP:')",
  productDescription: ".product-description, [data-testid='description'], meta[name='description']",
  productBrand: "a[href*='/brand/'] h2, [data-testid='brand-name']",
  productMainImage: "img[src*='products/images'], img[fetchpriority='high']",
};

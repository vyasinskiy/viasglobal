// Константы компании и юридические реквизиты (Испания / ЕС)
export const COMPANY_NAME = "Viasglobal";
export const OWNER_NAME = "Vitalii Iasinskii";
export const COMPANY_LEGAL_FORM = "Autónomo";
export const COMPANY_DOMAIN = "viasglobal.es";
export const COMPANY_EMAIL = "info@viasglobal.es";
export const COMPANY_PHONE = "+34 641 064 851";
export const COMPANY_ADDRESS = "Ronda Albocasser, 11, 12166 Els Ibarsos, Castellón (Valencia), Spain";
export const COMPANY_REGISTRATION = "ESZ1154366R"; // NIF / NIE / EU VAT ID
export const COMPANY_EORI = "ESZ1154366R";

// Ссылка на официальную валидацию в европейском реестре VIES
export const VIES_VALIDATION_URL = "https://ec.europa.eu/taxation_customs/vies/#/vat-validation";

// Ссылка на скачивание официального PDF профиля компании
export const COMPANY_DETAILS_PDF_URL = "/viasglobal-company-details.pdf";

// Cloudflare Turnstile Site Key (GDPR-compliant антиспам защита)
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAEVO8ajFIoZPl3v0";

// Цветовая корпоративная палитра B2B
export const COLORS = {
  primary: "#FF9900",       // Акцентный золотисто-оранжевый
  primaryDark: "#E68A00",   // Темно-оранжевый для наведения
  secondary: "#1E293B",     // Глубокий сланцевый / синий
  secondaryDark: "#0F172A", // Темный фон для шапки/футера
  accent: "#2563EB",        // Корпоративный синий
  background: "#FFFFFF",    // Основной фон
  paper: "#F8FAFC",         // Светло-серый фон карточек
  text: "#0F172A",          // Основной темный текст
  textSecondary: "#475569", // Вторичный текст
  border: "#E2E8F0",        // Границы карточек
  glassBg: "rgba(255, 255, 255, 0.85)",
  glassBorder: "rgba(226, 232, 240, 0.8)",
};

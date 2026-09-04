import { ProductCategory } from "../../../src/types";

/**
 * Сырые данные товара, извлеченные адаптером поставщика
 */
export interface ScrapedProductRaw {
  title: string; // Название товара на исходном языке
  description: string; // Полное описание
  shortDescription?: string; // Краткое описание
  price: number; // Итоговая розничная цена на витрине в евро (Наша цена с учетом маржи)
  distributorPrice?: number; // Оригинальная базовая цена дистрибьютора/поставщика без наценки (€)
  originalPrice?: number; // Исходная зачеркнутая цена до скидки (для акционных товаров)
  wholesalePrice?: number; // Оптовая/закупочная B2B цена поставщика без наценки
  retailPrice?: number; // Рекомендованная розничная цена поставщика (PVP) до добавления маржи
  currency: string; // Валюта (обычно 'EUR')
  brand: string; // Бренд / торговая марка
  sku?: string; // Артикул поставщика
  ean?: string; // Европейский штрихкод EAN-13 / GTIN
  mainImage: string; // Основное изображение высокого разрешения
  images: string[]; // Галерея дополнительных изображений
  specs?: Record<string, string>; // Свойства и характеристики (размеры, вес, материал)
  features?: string[]; // Список преимуществ / буллетов
  category?: ProductCategory | string; // Рекомендуемая категория
  tags?: string[]; // Коллекционные теги (например: ['playa', 'verano'])
  sourceUrl: string; // Прямая ссылка на карточку товара у поставщика
  sourceName: string; // Идентификатор источника (например, 'ankorstore')
  rawData: Record<string, unknown>; // Полный сырой снапшот (JSON-LD, метаданные и т.д.)
}

/**
 * Интерфейс сессии парсинга
 */
export interface ParsingRunRecord {
  id: string; // UUID сессии
  source: string; // Источник (ankorstore, faire и др.)
  sourceUrl: string; // Стартовая ссылка
  status: "running" | "completed" | "failed" | "paused_captcha";
  totalFound: number; // Обнаружено ссылок
  itemsScraped: number; // Успешно обработано
  itemsFailed: number; // Ошибок обработки
  startedAt: string; // ISO дата старта
  finishedAt?: string; // ISO дата завершения
  errorMessage?: string; // Текст ошибки при сбое
  logFilePath?: string; // Путь к файлу лога
  metadata?: Record<string, unknown>; // Параметры запуска
}

/**
 * Параметры командной строки CLI для запуска парсера
 */
export interface ScraperCliOptions {
  url: string; // URL коллекции, категории или страницы бренда
  limit?: number; // Максимальное количество товаров для сбора
  head?: boolean; // Запуск с видимым окном браузера (для ручного ввода капчи)
  category?: ProductCategory; // Принудительная категория магазина
  tags?: string[]; // Коллекционные теги для товаров (например: ['playa', 'verano'])
  source?: string; // Явное указание источника (если не определился по URL)
  margin?: number; // Процент маржи магазина, добавляемый к цене поставщика (по умолчанию 15%)
  verbose?: boolean; // Максимально подробный вывод в терминал
  saveJsonOnly?: boolean; // Сохранять только локально в JSON без обращения к Supabase
}

/**
 * Результат обработки одного товара
 */
export interface ScrapedItemResult {
  url: string;
  success: boolean;
  ean?: string;
  productId?: string;
  isExistingProduct?: boolean;
  error?: string;
}

/**
 * Статистика сессии парсинга
 */
export interface ParsingSessionStats {
  runId: string;
  source: string;
  sourceUrl: string;
  totalFound: number;
  totalScraped: number;
  totalSkippedOrFailed: number;
  newProductsCreated: number;
  existingProductsUpdated: number;
  durationMs: number;
}

/**
 * Запись сущности тематической коллекции / подборки
 */
export interface CollectionRecord {
  id: string; // Уникальный идентификатор (например: 'summer25-beach')
  slug: string; // ЧПУ
  titleEs: string; // Название подборки на испанском
  titleEn?: string; // Название на английском
  titleRu?: string; // Название на русском
  descriptionEs?: string; // Описание
  primaryTag: string; // Основной тег для товаров
  tags: string[]; // Все ассоциированные теги
  sourceUrl: string; // Ссылка на источник
  sourceName: string; // Название платформы ('ankorstore')
  bannerImage?: string; // Обложка коллекции
  totalProducts?: number; // Количество товаров
}

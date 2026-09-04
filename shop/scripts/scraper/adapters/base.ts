import { Page } from "playwright";
import { ScrapedProductRaw } from "../core/types";
import { ScraperLogger } from "../core/logger";

/**
 * Базовый абстрактный класс для всех адаптеров поставщиков
 */
export abstract class BaseSourceAdapter {
  /**
   * Уникальное системное имя источника (например, 'ankorstore', 'faire', 'distributor_x')
   */
  abstract readonly name: string;

  protected logger: ScraperLogger;

  constructor(logger: ScraperLogger) {
    this.logger = logger;
  }

  /**
   * Проверяет, подходит ли данный адаптер для переданного URL
   */
  abstract canHandle(url: string): boolean;

  /**
   * Собирает массив прямых ссылок на карточки товаров со страницы коллекции / категории / бренда
   * @param page Вкладка браузера Playwright
   * @param collectionUrl URL стартовой страницы
   * @param limit Максимальное количество ссылок для сбора
   */
  abstract collectProductUrls(page: Page, collectionUrl: string, limit?: number): Promise<string[]>;

  /**
   * Извлекает подробную информацию о товаре со страницы карточки
   * @param page Вкладка браузера Playwright
   * @param productUrl Прямая ссылка на товар
   * @param marginPercent Процент маржи/наценки магазина (по умолчанию 15%)
   */
  abstract scrapeProductPage(page: Page, productUrl: string, marginPercent?: number): Promise<ScrapedProductRaw | null>;

  /**
   * Очищает текст от лишних пробелов, переводов строк и HTML-сущностей
   */
  protected cleanText(text: string | null | undefined): string {
    if (!text) return "";
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Преобразует строковую цену (например, "34,90 €" или "45.00") в числовое значение
   */
  protected parsePrice(priceStr: string | number | null | undefined): number {
    if (typeof priceStr === "number") return priceStr;
    if (!priceStr) return 0;

    const cleaned = priceStr
      .toString()
      .replace(/[^0-9.,]/g, "")
      .replace(",", ".");

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }
}

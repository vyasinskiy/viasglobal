import { Page } from "playwright";
import { BaseSourceAdapter } from "../base";
import { ScrapedProductRaw } from "../../core/types";
import { ScraperLogger } from "../../core/logger";
import { ANKORSTORE_SELECTORS } from "./selectors";
import { parseAnkorstoreProductPage } from "./parser";

/**
 * Адаптер парсинга европейской B2B платформы Ankorstore
 */
export class AnkorstoreAdapter extends BaseSourceAdapter {
  readonly name = "ankorstore";

  constructor(logger: ScraperLogger) {
    super(logger);
  }

  /**
   * Проверяет, принадлежит ли ссылка домену Ankorstore
   */
  canHandle(url: string): boolean {
    return url.toLowerCase().includes("ankorstore.com");
  }

  /**
   * Собирает массив прямых ссылок на карточки товаров со страницы коллекции или каталога
   */
  async collectProductUrls(page: Page, collectionUrl: string, limit: number = 30): Promise<string[]> {
    this.logger.info("COLLECT_URLS", `Открытие страницы коллекции: ${collectionUrl} (требуется собрать: ${limit} шт.)`);

    // Переходим на страницу коллекции
    await page.goto(collectionUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Ожидаем загрузки товаров в Vue SPA
    try {
      await page.waitForSelector("a[href*='/brand/']", { timeout: 20000 });
    } catch {
      this.logger.warn("COLLECT_URLS", "Таймаут ожидания селектора a[href*='/brand/'], пробуем продолжить");
    }

    // Пытаемся закрыть баннер cookie, если он появился
    await this.dismissCookieBanner(page);

    const foundUrlsSet = new Set<string>();
    let previousCount = 0;
    let noNewItemsScrollCount = 0;
    const maxScrollAttempts = 40;

    // Цикл бесконечной прокрутки (infinite scroll) для подгрузки карточек
    for (let i = 0; i < maxScrollAttempts; i++) {
      // Собираем все ссылки на товары из DOM
      const pageLinks = await page.$$eval("a[href*='/brand/']", (elements) =>
        elements.map((el) => (el as HTMLAnchorElement).href || el.getAttribute("href") || "")
      );

      for (const link of pageLinks) {
        try {
          const parsedUrl = new URL(link.startsWith("http") ? link : `https://es.ankorstore.com${link}`);
          const parts = parsedUrl.pathname.split("/").filter(Boolean);
          // Формат ссылки на товар: /brand/{brand-slug}/{product-slug} (ровно или больше 3 частей, где parts[0] === 'brand')
          if (parts.length >= 3 && parts[0] === "brand") {
            const cleanUrl = `${parsedUrl.origin}/${parts.slice(0, 3).join("/")}`;
            foundUrlsSet.add(cleanUrl);
          }
        } catch {
          // Игнорируем невалидные ссылки
        }

        if (foundUrlsSet.size >= limit) {
          break;
        }
      }

      this.logger.debug(
        "COLLECT_URLS",
        `Шаг скролла #${i + 1}: обнаружено ${foundUrlsSet.size} уникальных товаров (цель: ${limit})`
      );

      if (foundUrlsSet.size >= limit) {
        this.logger.info("COLLECT_URLS", `Достигнут лимит в ${limit} товаров. Завершаем сбор ссылок.`);
        break;
      }

      // Проверка застревания прокрутки (достигли ли дна страницы)
      if (foundUrlsSet.size === previousCount) {
        noNewItemsScrollCount++;
        if (noNewItemsScrollCount >= 4) {
          this.logger.info("COLLECT_URLS", `Достигнут конец каталога (новых товаров не обнаружено).`);
          break;
        }
      } else {
        noNewItemsScrollCount = 0;
        previousCount = foundUrlsSet.size;
      }

      // Прокручиваем страницу вниз
      await page.evaluate(() => {
        window.scrollBy({ top: 1200, behavior: "smooth" });
      });

      // Небольшая задержка для загрузки новых блоков
      await page.waitForTimeout(1500);

      // Периодически проверяем появление всплывающих окон
      await this.dismissPopins(page);
    }

    const result = Array.from(foundUrlsSet).slice(0, limit);
    this.logger.info("COLLECT_URLS", `Итого собрано ${result.length} ссылок на товары для парсинга.`);
    return result;
  }

  /**
   * Загружает детальную карточку товара и извлекает все поля
   */
  async scrapeProductPage(page: Page, productUrl: string): Promise<ScrapedProductRaw | null> {
    try {
      await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

      // Закрываем модальные окна авторизации, если они появились
      await this.dismissPopins(page);

      // Запускаем извлечение через парсер
      return await parseAnkorstoreProductPage(page, productUrl, this.logger);
    } catch (err) {
      this.logger.error("FETCH_ITEM", `Не удалось загрузить страницу товара: ${productUrl}`, err, productUrl);
      return null;
    }
  }

  /**
   * Закрывает всплывающий баннер согласия с cookie
   */
  private async dismissCookieBanner(page: Page): Promise<void> {
    for (const selector of ANKORSTORE_SELECTORS.cookieAcceptButton) {
      try {
        const btn = await page.$(selector);
        if (btn && (await btn.isVisible())) {
          await btn.click();
          this.logger.debug("INIT", `Баннер cookie закрыт селектором: ${selector}`);
          await page.waitForTimeout(500);
          break;
        }
      } catch {
        // Игнорируем отсутствие элемента
      }
    }
  }

  /**
   * Закрывает всплывающие модальные окна (регистрация/логин/newsletter)
   */
  private async dismissPopins(page: Page): Promise<void> {
    for (const selector of ANKORSTORE_SELECTORS.authPopinCloseButton) {
      try {
        const btn = await page.$(selector);
        if (btn && (await btn.isVisible())) {
          await btn.click();
          this.logger.debug("FETCH_ITEM", `Модальное окно закрыто селектором: ${selector}`);
          await page.waitForTimeout(300);
          break;
        }
      } catch {
        // Игнорируем отсутствие элемента
      }
    }
  }
}

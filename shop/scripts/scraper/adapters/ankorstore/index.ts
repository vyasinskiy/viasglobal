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
  async collectProductUrls(page: Page, collectionUrl: string, limit: number = 0): Promise<string[]> {
    const isUnlimited = limit <= 0;
    this.logger.info(
      "COLLECT_URLS",
      `Открытие страницы коллекции: ${collectionUrl} (${isUnlimited ? "режим: парсить ВСЮ подборку до конца" : `лимит: ${limit} шт.`})`
    );

    const foundUrlsSet = new Set<string>();
    let currentUrl = collectionUrl;
    let pageNum = 1;
    const maxPages = 20;

    // Цикл обхода страниц пагинации (?p=1, ?p=2...)
    while (pageNum <= maxPages) {
      this.logger.info("COLLECT_URLS", `[Пагинация ${pageNum}] Загрузка страницы: ${currentUrl}`);

      await page.goto(currentUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

      // Ожидаем загрузки товаров в Vue SPA
      try {
        await page.waitForSelector("a[href*='/brand/']", { timeout: 20000 });
      } catch {
        this.logger.warn("COLLECT_URLS", `Таймаут ожидания товаров на странице #${pageNum}, пробуем продолжить`);
      }

      // Пытаемся закрыть баннер cookie, если он появился
      await this.dismissCookieBanner(page);

      let previousCount = foundUrlsSet.size;
      let noNewItemsScrollCount = 0;
      const maxScrollAttempts = 35;

      // Цикл бесконечной прокрутки (infinite scroll) внутри текущей страницы
      for (let s = 0; s < maxScrollAttempts; s++) {
        // Собираем все ссылки на товары из DOM
        const pageLinks = await page.$$eval("a[href*='/brand/']", (elements) =>
          elements.map((el) => (el as HTMLAnchorElement).href || el.getAttribute("href") || "")
        );

        for (const link of pageLinks) {
          try {
            const parsedUrl = new URL(link.startsWith("http") ? link : `https://es.ankorstore.com${link}`);
            const parts = parsedUrl.pathname.split("/").filter(Boolean);
            // Формат ссылки на товар: /brand/{brand-slug}/{product-slug} (3+ части, где parts[0] === 'brand')
            if (parts.length >= 3 && parts[0] === "brand") {
              const cleanUrl = `${parsedUrl.origin}/${parts.slice(0, 3).join("/")}`;
              foundUrlsSet.add(cleanUrl);
            }
          } catch {
            // Игнорируем невалидные ссылки
          }

          if (!isUnlimited && foundUrlsSet.size >= limit) {
            break;
          }
        }

        if (!isUnlimited && foundUrlsSet.size >= limit) {
          this.logger.info("COLLECT_URLS", `Достигнут лимит в ${limit} товаров. Завершаем сбор.`);
          break;
        }

        // Проверка завершения подгрузки товаров на текущей странице
        if (foundUrlsSet.size === previousCount) {
          noNewItemsScrollCount++;
          if (noNewItemsScrollCount >= 4) {
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
        await page.waitForTimeout(1000);
        await this.dismissPopins(page);
      }

      this.logger.info(
        "COLLECT_URLS",
        `[Пагинация ${pageNum}] Собрано товаров на данный момент: ${foundUrlsSet.size}`
      );

      if (!isUnlimited && foundUrlsSet.size >= limit) {
        break;
      }

      // Поиск ссылки на следующую страницу (кнопка 'Siguiente >>' или '?p=N')
      const nextPageUrl = await page.evaluate((currPage) => {
        const allLinks = Array.from(document.querySelectorAll("a"));

        // 1. Ищем кнопку Siguiente / Next
        const nextBtn = allLinks.find((a) => {
          const text = a.textContent?.trim() || "";
          return (
            (/siguiente|next|>>/i.test(text) || a.getAttribute("rel") === "next") &&
            !a.classList.contains("disabled") &&
            !a.getAttribute("aria-disabled")
          );
        });
        if (nextBtn && nextBtn.href && !nextBtn.href.includes("javascript")) {
          return nextBtn.href;
        }

        // 2. Ищем ссылку с параметром ?p=currPage+1 или ?page=currPage+1
        const nextPageTarget = currPage + 1;
        const numberedLink = allLinks.find((a) => {
          const href = a.href || "";
          return (
            href.includes(`p=${nextPageTarget}`) ||
            href.includes(`page=${nextPageTarget}`) ||
            a.textContent?.trim() === String(nextPageTarget)
          );
        });
        if (numberedLink && numberedLink.href) {
          return numberedLink.href;
        }

        return null;
      }, pageNum);

      if (nextPageUrl && nextPageUrl !== currentUrl) {
        this.logger.info("COLLECT_URLS", `Обнаружен переход на страницу #${pageNum + 1}: ${nextPageUrl}`);
        currentUrl = nextPageUrl;
        pageNum++;
      } else {
        this.logger.info("COLLECT_URLS", `Все страницы пагинации успешно пройдены (всего страниц: ${pageNum}).`);
        break;
      }
    }

    const result = isUnlimited ? Array.from(foundUrlsSet) : Array.from(foundUrlsSet).slice(0, limit);
    this.logger.info("COLLECT_URLS", `Итого собрано ${result.length} уникальных ссылок на товары для парсинга.`);
    return result;
  }

  /**
   * Загружает детальную карточку товара и извлекает все поля с добавлением маржи (по умолчанию 15%)
   */
  async scrapeProductPage(page: Page, productUrl: string, marginPercent: number = 15): Promise<ScrapedProductRaw | null> {
    try {
      await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

      // Закрываем модальные окна авторизации, если они появились
      await this.dismissPopins(page);

      // Запускаем извлечение через парсер с применением маржи
      return await parseAnkorstoreProductPage(page, productUrl, this.logger, marginPercent);
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

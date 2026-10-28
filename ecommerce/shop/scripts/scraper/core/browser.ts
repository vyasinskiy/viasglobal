import { chromium, Browser, BrowserContext, Page } from "playwright";
import { ScraperLogger } from "./logger";
import { isCaptchaOrChallengePresent, waitForManualCaptchaResolution } from "./captcha";

export interface BrowserManagerOptions {
  headless?: boolean;
  locale?: string;
  viewport?: { width: number; height: number };
}

/**
 * Менеджер жизненного цикла браузера Playwright с маскировкой под реального пользователя
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private logger: ScraperLogger;

  constructor(logger: ScraperLogger) {
    this.logger = logger;
  }

  /**
   * Инициализирует браузер и создает контекст с испанской локалью и защитой от детекта автоматизации
   */
  public async init(options: BrowserManagerOptions = {}): Promise<BrowserContext> {
    const headless = options.headless !== undefined ? options.headless : true;
    const locale = options.locale || "es-ES";
    const viewport = options.viewport || { width: 1440, height: 900 };

    this.logger.info(
      "BROWSER_START",
      `Запуск Playwright Chromium (headless: ${headless}, локаль: ${locale}, размер экрана: ${viewport.width}x${viewport.height})`
    );

    // Запуск Chromium с флагами отключения стандартных меток автоматизации webdriver
    this.browser = await chromium.launch({
      headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        `--window-size=${viewport.width},${viewport.height}`,
      ],
    });

    // Настройка контекста браузера с реалистичным User-Agent и локалью
    this.context = await this.browser.newContext({
      viewport,
      locale,
      timezoneId: "Europe/Madrid",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    });

    // Инжектим скрипт для скрытия navigator.webdriver от антибот-систем
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    return this.context;
  }

  /**
   * Безопасный переход по URL с автоматической проверкой на капчу
   */
  public async safeNavigate(page: Page, url: string, timeoutMs: number = 45000): Promise<void> {
    this.logger.debug("FETCH_ITEM", `Открытие URL: ${url}`);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    // Проверяем, не натолкнулись ли на экран капчи
    const captchaCheck = await isCaptchaOrChallengePresent(page);
    if (captchaCheck.detected) {
      await waitForManualCaptchaResolution(page, this.logger, captchaCheck.reason || "Неизвестная капча");
    }
  }

  /**
   * Закрытие браузера и освобождение ресурсов
   */
  public async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.logger.debug("FINISH", "Браузер Playwright успешно закрыт");
    } catch (err) {
      this.logger.warn("FINISH", "Ошибка при закрытии браузера", { error: String(err) });
    }
  }
}

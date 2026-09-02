import readline from "readline";
import { Page } from "playwright";
import { ScraperLogger } from "./logger";

/**
 * Проверяет, заблокирована ли страница капчей или экраном Cloudflare
 */
export async function isCaptchaOrChallengePresent(page: Page): Promise<{ detected: boolean; reason?: string }> {
  try {
    const title = (await page.title()).toLowerCase();
    const content = (await page.content()).toLowerCase();

    // 1. Проверка Cloudflare
    if (
      title.includes("just a moment") ||
      title.includes("un momento") ||
      title.includes("attention required") ||
      content.includes("cf-browser-verification") ||
      content.includes("challenge-running") ||
      content.includes("cf-turnstile")
    ) {
      return { detected: true, reason: "Cloudflare Turnstile / Challenge" };
    }

    // 2. Проверка Google reCAPTCHA
    if (content.includes("g-recaptcha") || content.includes("recaptcha/api.js")) {
      const iframe = await page.$("iframe[src*='recaptcha']");
      if (iframe) {
        return { detected: true, reason: "Google reCAPTCHA" };
      }
    }

    // 3. Проверка hCaptcha
    if (content.includes("hcaptcha.com") || (await page.$("iframe[src*='hcaptcha']"))) {
      return { detected: true, reason: "hCaptcha" };
    }

    // 4. Проверка DataDome / PerimeterX / Bot detection
    if (content.includes("datadome") || content.includes("perimeterx") || content.includes("access denied")) {
      return { detected: true, reason: "Антибот защита (DataDome/PerimeterX/403)" };
    }

    return { detected: false };
  } catch (err) {
    return { detected: false };
  }
}

/**
 * Ожидает ручного прохождения капчи пользователем в открытом браузере
 */
export async function waitForManualCaptchaResolution(page: Page, logger: ScraperLogger, reason: string): Promise<void> {
  logger.warn(
    "CAPTCHA_WAIT",
    `⚠️ ОБНАРУЖЕНА ЗАЩИТА/КАПЧА (${reason})! Браузер приостановлен для ручного вмешательства.`
  );

  console.log("\n" + "=".repeat(75));
  console.log("  ⚠️  ВНИМАНИЕ: САЙТ ТРЕБУЕТ ПРОХОЖДЕНИЯ ПРОВЕРКИ (КАПЧА)");
  console.log(`  Причина: ${reason}`);
  console.log("  1. Перейдите в открытое окно браузера Playwright.");
  console.log("  2. Пройдите капчу вручную (поставьте галочку / решите тест).");
  console.log("  3. Дождитесь загрузки страницы каталога.");
  console.log("  4. Вернитесь в этот терминал и нажмите [ENTER], чтобы продолжить.");
  console.log("=".repeat(75) + "\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  await new Promise<void>((resolve) => {
    rl.question("👉 Нажмите [ENTER] после решения капчи в окне браузера: ", () => {
      rl.close();
      resolve();
    });
  });

  logger.info("CAPTCHA_CHECK", "Пользователь подтвердил прохождение капчи. Проверяем статус страницы...");

  // Дополнительно ждем стабилизации DOM после решения
  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });
  } catch {
    // Игнорируем таймаут ожидания состояния
  }

  logger.info("CAPTCHA_CHECK", "Страница разблокирована. Продолжаем работу парсера.");
}

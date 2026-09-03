import crypto from "crypto";
import { BrowserManager } from "./core/browser";
import { ScraperLogger } from "./core/logger";
import { ScraperStorage } from "./core/storage";
import { AdapterRegistry } from "./adapters/registry";
import { ScraperCliOptions } from "./core/types";
import { extractCollectionTags } from "./core/tagHelper";
import { ProductCategory } from "../../src/types";

/**
 * Парсер аргументов командной строки (CLI)
 */
function parseCliArgs(): ScraperCliOptions {
  const args = process.argv.slice(2);
  let url = "";
  let limit = 0; // По умолчанию 0 — собирать всю коллекцию до конца без ограничения
  let head = false;
  let category: ProductCategory | undefined = undefined;
  let tags: string[] | undefined = undefined;
  let source: string | undefined = undefined;
  let saveJsonOnly = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--head" || arg === "-h" || arg === "--interactive") {
      head = true;
    } else if (arg === "--limit" || arg === "-l") {
      limit = parseInt(args[++i], 10) || 0;
    } else if (arg === "--all") {
      limit = 0;
    } else if (arg === "--category" || arg === "-c") {
      category = args[++i] as ProductCategory;
    } else if (arg === "--tags" || arg === "-t") {
      const rawTags = args[++i] || "";
      tags = rawTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    } else if (arg === "--source" || arg === "-s") {
      source = args[++i];
    } else if (arg === "--save-json-only") {
      saveJsonOnly = true;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    } else if (!arg.startsWith("--") && !url) {
      url = arg;
    } else if (arg === "--url" || arg === "-u") {
      url = args[++i];
    }
  }

  // Если URL не передан, показываем подсказку по использованию
  if (!url) {
    console.log("\n" + "=".repeat(75));
    console.log("  🛍️  VIASGLOBAL STORE — МОДУЛЬНЫЙ ПАРСЕР ПОСТАВЩИКОВ (PLAYWRIGHT)");
    console.log("=".repeat(75));
    console.log("\nИспользование:");
    console.log("  npm run scrape -- <URL> [опции]\n");
    console.log("Примеры:");
    console.log('  npm run scrape -- "https://es.ankorstore.com/collection/backtoschool2025" --limit 20');
    console.log('  npm run scrape -- "https://es.ankorstore.com/collection/backtoschool2025" --limit 10 --head');
    console.log('  npm run scrape -- "https://es.ankorstore.com/boutique/gift-universe" --category workspace\n');
    console.log("Доступные опции:");
    console.log("  --limit, -l <число>      Лимит собираемых товаров (по умолчанию 20)");
    console.log("  --head, -h, --interactive Запуск с видимым окном браузера (для ручного ввода капчи)");
    console.log("  --category, -c <категория> Категория магазина (electronics, workspace, lifestyle, smart-home, audio)");
    console.log("  --tags, -t <теги>         Теги через запятую (например: playa,verano)");
    console.log("  --source, -s <источник>   Принудительный выбор адаптера (ankorstore и др.)");
    console.log("  --save-json-only          Сохранять только локально в JSON без отправки в Supabase");
    console.log("  --verbose, -v             Подробный вывод всех шагов");
    console.log("=".repeat(75) + "\n");
    process.exit(1);
  }

  return { url, limit, head, category, tags, source, saveJsonOnly, verbose };
}

/**
 * Главная функция запуска процесса парсинга
 */
async function main(): Promise<void> {
  const options = parseCliArgs();
  const runId = crypto.randomUUID();
  const startTime = Date.now();

  // 1. Инициализация логгера
  const initialSource = options.source || "auto";
  const logger = new ScraperLogger(runId, initialSource);

  const effectiveTags = extractCollectionTags(options.url, options.tags);

  console.log("\n" + "=".repeat(75));
  console.log("  🚀 СТАРТ СЕССИИ ПАРСИНГА ТОВАРОВ");
  console.log(`  ID сессии:  ${runId}`);
  console.log(`  Целевой URL: ${options.url}`);
  console.log(`  Лимит:      ${options.limit && options.limit > 0 ? `${options.limit} товаров` : "БЕЗ ОГРАНИЧЕНИЯ (собирать подборку до конца)"}`);
  console.log(`  Теги:       ${effectiveTags.length > 0 ? effectiveTags.join(", ") : "авто-определение"}`);
  console.log(`  Режим:      ${options.head ? "Интерактивный (с видимым окном)" : "Headless"}`);
  console.log("=".repeat(75) + "\n");

  // 2. Инициализация реестра адаптеров
  const registry = new AdapterRegistry(logger);
  let adapter;
  try {
    adapter = registry.getAdapter(options.url, options.source);
  } catch (err) {
    logger.error("INIT", "Ошибка выбора адаптера", err);
    process.exit(1);
  }

  // 3. Инициализация хранилища Supabase / JSON
  const storage = new ScraperStorage(logger);
  await storage.createParsingRun(runId, adapter.name, options.url, {
    limit: options.limit,
    head: options.head,
    category: options.category,
    tags: effectiveTags,
  });

  // 4. Запуск браузера Playwright
  const browserManager = new BrowserManager(logger);
  let context;
  try {
    context = await browserManager.init({
      headless: !options.head,
      locale: "es-ES",
    });
  } catch (err) {
    logger.error("BROWSER_START", "Не удалось запустить браузер Playwright", err);
    await storage.updateParsingRun(runId, "failed", 0, 0, 0, String(err));
    process.exit(1);
  }

  const page = await context.newPage();
  let scrapedCount = 0;
  let failedCount = 0;
  let productUrls: string[] = [];

  try {
    // 5. Сбор ссылок со страницы коллекции / категории
    productUrls = await adapter.collectProductUrls(page, options.url, options.limit);

    if (productUrls.length === 0) {
      logger.warn("COLLECT_URLS", "Не найдено ни одной подходящей ссылки на товары на указанной странице.");
      await storage.updateParsingRun(runId, "completed", 0, 0, 0, "Товары не найдены");
      return;
    }

    // 5.1 Автоматическое извлечение названия подборки и создание сущности в таблице collections
    let collectionTitle = "";
    try {
      collectionTitle = (await page.$eval("h1", (el) => el.textContent?.trim() || "")) || "";
    } catch {
      // Игнорируем
    }
    if (!collectionTitle) {
      try {
        const rawTitle = await page.title();
        collectionTitle = rawTitle.split("|")[0].split("-")[0].trim();
      } catch {
        // Игнорируем
      }
    }
    if (!collectionTitle) {
      const slugPart = new URL(options.url).pathname.split("/").filter(Boolean).pop() || "coleccion";
      collectionTitle = slugPart.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const collectionSlug = new URL(options.url).pathname.split("/").filter(Boolean).pop() || `coll-${Date.now()}`;
    const primaryTag = effectiveTags[0] || collectionSlug;

    await storage.saveCollection({
      id: collectionSlug,
      slug: collectionSlug,
      titleEs: collectionTitle,
      titleEn: collectionTitle,
      primaryTag,
      tags: effectiveTags,
      sourceUrl: options.url,
      sourceName: adapter.name,
      totalProducts: productUrls.length,
    });

    logger.info("COLLECT_URLS", `Начинаем поштучный сбор ${productUrls.length} товаров...`);

    // 6. Поштучный парсинг каждого товара
    for (let i = 0; i < productUrls.length; i++) {
      const itemUrl = productUrls[i];
      const itemIndexStr = `[${i + 1}/${productUrls.length}]`;

      logger.info("FETCH_ITEM", `${itemIndexStr} Обработка товара: ${itemUrl}`, undefined, itemUrl);

      try {
        const rawProduct = await adapter.scrapeProductPage(page, itemUrl);

        if (!rawProduct) {
          logger.warn("VALIDATE", `${itemIndexStr} Не удалось извлечь данные товара. Пропускаем.`, undefined, itemUrl);
          failedCount++;
          continue;
        }

        // Если при запуске задана конкретная категория витрины, переопределяем
        if (options.category) {
          rawProduct.category = options.category;
        }

        // Прикрепляем определенные/переданные теги к товару
        if (effectiveTags && effectiveTags.length > 0) {
          rawProduct.tags = effectiveTags;
        }

        // Сохранение в Supabase (с дедупликацией по EAN) и в локальный бэкап
        const saveResult = await storage.saveProduct(runId, rawProduct);

        if (saveResult.success) {
          scrapedCount++;
          logger.info(
            "SAVE_MASTER",
            `${itemIndexStr} ✅ Успешно сохранен товар: "${rawProduct.title}" (EAN: ${rawProduct.ean || "нет"}, Цена: ${rawProduct.price} €)`,
            undefined,
            itemUrl
          );
        } else {
          failedCount++;
          logger.error("SAVE_MASTER", `${itemIndexStr} ❌ Ошибка сохранения в хранилище`, saveResult.error, itemUrl);
        }

        // Небольшая вежливая задержка между товарами
        await page.waitForTimeout(800);
      } catch (itemErr) {
        failedCount++;
        logger.error("FETCH_ITEM", `${itemIndexStr} Непредвиденная ошибка при обработке товара`, itemErr, itemUrl);
      }
    }

    // 7. Обновление финального статуса в Supabase
    await storage.updateParsingRun(runId, "completed", scrapedCount, failedCount, productUrls.length);
  } catch (globalErr) {
    logger.error("FINISH", "Критический сбой сессии парсинга", globalErr);
    await storage.updateParsingRun(runId, "failed", scrapedCount, failedCount, productUrls.length, String(globalErr));
  } finally {
    // 8. Освобождение ресурсов
    await browserManager.close();

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    // Красивый финальный отчет
    console.log("\n" + "=".repeat(75));
    console.log("  🏁 СЕССИЯ ПАРСИНГА ЗАВЕРШЕНА");
    console.log("=".repeat(75));
    console.log(`  ID сессии:            ${runId}`);
    console.log(`  Источник:             ${adapter.name}`);
    console.log(`  Обнаружено ссылок:    ${productUrls.length}`);
    console.log(`  Успешно спарсено:     ${scrapedCount} шт.`);
    console.log(`  Ошибок / пропущено:   ${failedCount} шт.`);
    console.log(`  Время выполнения:     ${durationSeconds} сек.`);
    console.log(`  Лог-файл сессии:      ${logger.getLogFilePath()}`);
    console.log(`  Локальный JSON-дамп:  src/data/scraped_products.json`);
    console.log("=".repeat(75) + "\n");

    logger.close();
  }
}

// Запуск CLI
main().catch((err) => {
  console.error("Критическая ошибка CLI:", err);
  process.exit(1);
});

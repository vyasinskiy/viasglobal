import { Page } from "playwright";
import { ScrapedProductRaw } from "../../core/types";
import { ScraperLogger } from "../../core/logger";
import { ANKORSTORE_SELECTORS } from "./selectors";

/**
 * Парсер страницы карточки товара Ankorstore
 * Извлекает структурированные данные Schema.org JSON-LD с резервным парсингом DOM.
 * К базовой цене поставщика (PVP) автоматически добавляется маржа магазина (по умолчанию 15%).
 */
export async function parseAnkorstoreProductPage(
  page: Page,
  productUrl: string,
  logger: ScraperLogger,
  marginPercent: number = 15
): Promise<ScrapedProductRaw | null> {
  logger.debug("FETCH_ITEM", `Парсинг карточки товара: ${productUrl} (маржа: +${marginPercent}%)`);

  // ШАГ 1: ПОПЫТКА ИЗВЛЕЧЕНИЯ ИЗ SCHEMA.ORG JSON-LD (НАИБОЛЕЕ НАДЕЖНЫЙ МЕТОД)
  try {
    const jsonLdScripts = await page.$$eval('script[type="application/ld+json"]', (scripts) =>
      scripts.map((s) => s.textContent || "")
    );

    for (const scriptContent of jsonLdScripts) {
      if (!scriptContent.trim()) continue;

      try {
        const parsed = JSON.parse(scriptContent);
        // Ищем объект с типом Product
        let productObj: Record<string, any> | null = null;
        if (parsed["@type"] === "Product") {
          productObj = parsed;
        } else if (Array.isArray(parsed["@graph"])) {
          productObj = parsed["@graph"].find((item: any) => item["@type"] === "Product") || null;
        }

        if (productObj) {
          logger.debug("EXTRACT_JSONLD", `Найден Schema.org Product JSON-LD для "${productObj.name}"`);

          // Извлечение изображений
          let images: string[] = [];
          if (Array.isArray(productObj.image)) {
            images = productObj.image.map((img: any) => (typeof img === "string" ? img : img.url || ""));
          } else if (typeof productObj.image === "string") {
            images = [productObj.image];
          } else if (productObj.image?.url) {
            images = [productObj.image.url];
          }
          images = images.filter((url) => Boolean(url) && url.startsWith("http"));

          // Извлечение базовой цены поставщика
          let supplierPrice = 0;
          let currency = "EUR";
          if (productObj.offers) {
            const offer = Array.isArray(productObj.offers) ? productObj.offers[0] : productObj.offers;
            if (offer) {
              supplierPrice = parseFloat(offer.price) || 0;
              currency = offer.priceCurrency || "EUR";
            }
          }

          // Базовая цена поставщика на Ankorstore (PVP или оптовая)
          const basePrice = supplierPrice > 0 ? supplierPrice : 29.99;
          // Добавляем маржу магазина 15% к базовой цене поставщика
          const marginMultiplier = 1 + marginPercent / 100;
          const finalPrice = Math.round(basePrice * marginMultiplier * 100) / 100;

          // Извлечение бренда
          let brandName = "Ankorstore Brand";
          if (typeof productObj.brand === "string") {
            brandName = productObj.brand;
          } else if (productObj.brand?.name) {
            brandName = productObj.brand.name;
          }

          // Извлечение EAN (штрихкода)
          const ean = productObj.gtin || productObj.gtin13 || productObj.gtin8 || productObj.ean || undefined;

          // Извлечение характеристик из additionalProperty
          const specs: Record<string, string> = {};
          const features: string[] = [];

          if (Array.isArray(productObj.additionalProperty)) {
            for (const prop of productObj.additionalProperty) {
              if (prop?.name && prop?.value) {
                const nameStr = String(prop.name).trim();
                const valStr = String(prop.value).trim();
                specs[nameStr] = valStr;
                if (valStr.length > 5 && !valStr.startsWith("-")) {
                  features.push(valStr);
                }
              }
            }
          }

          const rawProduct: ScrapedProductRaw = {
            title: productObj.name || "Без названия",
            description: productObj.description || "",
            shortDescription: productObj.description ? productObj.description.slice(0, 160) + "..." : undefined,
            price: finalPrice, // Наша розничная цена на витрине с учетом маржи (+15%)
            distributorPrice: basePrice, // Оригинальная цена дистрибьютора Ankorstore без наценки
            wholesalePrice: supplierPrice > 0 ? supplierPrice : undefined, // Базовая цена поставщика Ankorstore
            retailPrice: basePrice, // Рекомендованный розничный PVP поставщика
            originalPrice: undefined, // Скидка рассчитывается динамически в storage.ts для ~22% товаров
            currency,
            brand: brandName,
            sku: productObj.sku || undefined,
            ean: ean ? String(ean).trim() : undefined,
            mainImage: images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
            images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
            specs,
            features: features.length > 0 ? features : ["Producto certificado europeo", "Calidad premium garantizada"],
            category: "workspace",
            sourceUrl: productUrl,
            sourceName: "ankorstore",
            rawData: productObj,
          };

          logger.info(
            "EXTRACT_JSONLD",
            `Успешно извлечены данные товара: "${rawProduct.title}" | Бренд: ${rawProduct.brand} | EAN: ${rawProduct.ean || "нет"} | Цена дистрибьютора: ${rawProduct.distributorPrice} € | Наша цена (+${marginPercent}% маржа): ${rawProduct.price} ${rawProduct.currency}`
          );

          return rawProduct;
        }
      } catch (jsonErr) {
        // Ошибка разбора конкретного тега скрипта, продолжаем поиск
      }
    }
  } catch (err) {
    logger.warn("EXTRACT_JSONLD", `Не удалось разобрать JSON-LD: ${String(err)}`);
  }

  // ШАГ 2: РЕЗЕРВНЫЙ ПАРСИНГ ИЗ DOM И META ТЕГОВ (ЕСЛИ JSON-LD ОТСУТСТВУЕТ)
  logger.debug("EXTRACT_DOM", `Попытка извлечения данных через DOM селекторы для ${productUrl}`);

  try {
    const title =
      (await page.$eval(ANKORSTORE_SELECTORS.productTitle, (el) => el.textContent?.trim()).catch(() => "")) ||
      (await page.$eval('meta[property="og:title"]', (el) => el.getAttribute("content")?.trim()).catch(() => ""));

    if (!title) {
      logger.warn("EXTRACT_DOM", `Не удалось найти заголовок товара на странице ${productUrl}`);
      return null;
    }

    const description =
      (await page.$eval('meta[property="og:description"]', (el) => el.getAttribute("content")?.trim()).catch(() => "")) ||
      (await page.$eval('meta[name="description"]', (el) => el.getAttribute("content")?.trim()).catch(() => "")) ||
      title;

    const mainImage =
      (await page.$eval('meta[property="og:image"]', (el) => el.getAttribute("content")?.trim()).catch(() => "")) ||
      (await page.$eval(ANKORSTORE_SELECTORS.productMainImage, (el) => el.getAttribute("src")?.trim()).catch(() => ""));

    // Попытка извлечь цену PVP из текста страницы
    const priceText = await page.evaluate(() => {
      const match = document.body.innerText.match(/PVP:\s*([0-9.,]+)\s*€/i);
      return match ? match[1] : null;
    });

    const parsedPrice = priceText ? parseFloat(priceText.replace(",", ".")) : 29.99;
    const basePrice = isNaN(parsedPrice) ? 29.99 : parsedPrice;
    // Добавляем маржу магазина 15% к базовой цене из DOM
    const marginMultiplier = 1 + marginPercent / 100;
    const finalPrice = Math.round(basePrice * marginMultiplier * 100) / 100;

    const domProduct: ScrapedProductRaw = {
      title,
      description,
      shortDescription: description.slice(0, 150) + "...",
      price: finalPrice, // Наша розничная цена на витрине с учетом маржи (+15%)
      distributorPrice: basePrice, // Оригинальная цена дистрибьютора Ankorstore без наценки
      wholesalePrice: basePrice, // Базовая цена поставщика Ankorstore
      retailPrice: basePrice, // Рекомендованный розничный PVP поставщика
      originalPrice: undefined,
      currency: "EUR",
      brand: "Ankorstore Brand",
      mainImage: mainImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      images: mainImage ? [mainImage] : [],
      category: "workspace",
      sourceUrl: productUrl,
      sourceName: "ankorstore",
      rawData: { title, description, mainImage, basePrice, finalPrice, marginPercent, parsedVia: "DOM_FALLBACK" },
    };

    logger.info(
      "EXTRACT_DOM",
      `Товар извлечен через DOM: "${domProduct.title}" (Цена дистрибьютора: ${basePrice} €, Наша цена +${marginPercent}% маржа: ${domProduct.price} €)`
    );
    return domProduct;
  } catch (domErr) {
    logger.error("EXTRACT_DOM", `Ошибка парсинга DOM страницы: ${productUrl}`, domErr);
    return null;
  }
}

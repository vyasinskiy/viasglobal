import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { ScraperLogger } from "./core/logger";
import { transformImageAntiSearch } from "./core/imageTransformer";

// Загружаем конфигурацию из .env.local и .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Скрипт бэкфилла:
 * 1. Фиксирует оригинальные ссылки в колонках original_main_image и original_images.
 * 2. Проверяет наличие или трансформирует фото с защитой от поиска (микроповорот, кроп, рамка, гамма, зерно).
 * 3. Загружает в тот же бакет с неявным суффиксом _opt.webp.
 * 4. Назначает _opt.webp в качестве активных изображений main_image и images в PostgreSQL.
 */
async function runAntiSearchBackfill() {
  const logger = new ScraperLogger("backfill_opt_images", "products");
  logger.info("BACKFILL", "Запуск синхронизации изображений с суффиксом _opt и сохранением оригиналов в PostgreSQL...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("BACKFILL", "В .env.local / .env не найден DATABASE_URL");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yzaarsfeztkkzuexhivl.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  const supabase = createClient(supabaseUrl, supabaseKey);
  const bucketName = "products";

  // Подключаемся к PostgreSQL через pg Client
  const pgClient = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await pgClient.connect();
  logger.info("BACKFILL", "✅ Успешное подключение к PostgreSQL Supabase");

  // 1. Выбираем товары из БД
  const res = await pgClient.query(
    "SELECT id, main_image, images, original_main_image, original_images FROM products ORDER BY id;"
  );
  const products = res.rows;

  logger.info("BACKFILL", `Найдено товаров для обновления: ${products.length}`);

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const sanitizedId = product.id.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Исходные оригиналы (если уже заполнены или берем из текущих)
    const originalMain = product.original_main_image || product.main_image;
    const rawGallery = Array.isArray(product.original_images) && product.original_images.length > 0
      ? product.original_images
      : Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [originalMain];

    try {
      // Функция получения или создания _opt.webp ссылки
      const getOrCreateOptImage = async (sourceUrl: string, index: number): Promise<string> => {
        if (!sourceUrl || sourceUrl.startsWith("/images/placeholder")) {
          return sourceUrl;
        }

        if (sourceUrl.includes("_opt.webp")) {
          return sourceUrl;
        }

        const hash = crypto.createHash("md5").update(sourceUrl).digest("hex").slice(0, 8);
        const storagePath = `${sanitizedId}/img_${index}_${hash}_opt.webp`;
        const expectedCdnUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;

        // Проверяем доступность файла в CDN
        try {
          const checkRes = await fetch(expectedCdnUrl, { method: "HEAD" });
          if (checkRes.ok) {
            return expectedCdnUrl;
          }
        } catch {
          // Если HEAD не прошел, скачиваем и загружаем
        }

        logger.debug("BACKFILL", `Скачивание и трансформация: ${sourceUrl}`);
        const response = await fetch(sourceUrl);
        if (!response.ok) {
          logger.warn("BACKFILL", `Не удалось скачать ${sourceUrl}: HTTP ${response.status}`);
          return sourceUrl;
        }

        const rawBuffer = Buffer.from(await response.arrayBuffer());
        const transformedBuffer = await transformImageAntiSearch(rawBuffer);

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, transformedBuffer, {
            contentType: "image/webp",
            upsert: true,
          });

        if (uploadError) {
          logger.warn("BACKFILL", `Ошибка загрузки в CDN: ${uploadError.message}`);
          return sourceUrl;
        }

        return expectedCdnUrl;
      };

      // Обработка главного фото
      const activeMainImage = await getOrCreateOptImage(originalMain, 0);

      // Обработка галереи
      const activeGalleryImages: string[] = [];
      for (let gIdx = 0; gIdx < rawGallery.length; gIdx++) {
        const itemUrl = rawGallery[gIdx];
        const optUrl = await getOrCreateOptImage(itemUrl, gIdx);
        activeGalleryImages.push(optUrl);
      }

      // Обновляем запись в PostgreSQL
      await pgClient.query(
        `UPDATE products 
         SET main_image = $1,
             images = $2,
             original_main_image = $3,
             original_images = $4,
             updated_at = NOW()
         WHERE id = $5;`,
        [
          activeMainImage,
          JSON.stringify(activeGalleryImages.length > 0 ? activeGalleryImages : [activeMainImage]),
          originalMain,
          JSON.stringify(rawGallery),
          product.id,
        ]
      );

      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === products.length) {
        logger.info("BACKFILL", `Прогресс: обновлено ${updatedCount} из ${products.length} товаров...`);
      }
    } catch (itemErr: any) {
      logger.error("BACKFILL", `Ошибка обновления товара ${product.id}: ${itemErr.message}`);
    }
  }

  await pgClient.end();
  logger.info("BACKFILL", `🏁 Успешно завершено! Обновлено в PostgreSQL: ${updatedCount} из ${products.length}`);
}

// Запуск
if (require.main === module) {
  runAntiSearchBackfill().catch((err) => {
    console.error("Фатальная ошибка скрипта бэкфилла:", err);
    process.exit(1);
  });
}

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Client } from "pg";
import { ScraperLogger } from "./core/logger";
import { ImageCdnUploader } from "./core/imageUploader";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Скрипт переноса всех изображений существующих товаров из Ankorstore в наш собственный Supabase CDN
 */
async function backfillImages() {
  const logger = new ScraperLogger("cdn_backfill", "supabase_storage");
  logger.info("INIT", "Запуск переноса картинок в наш Supabase Storage CDN...");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("INIT", "DATABASE_URL не найден в .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    logger.info("INIT", "Подключение к базе данных PostgreSQL установлено");

    // 1. Применяем SQL настройку бакета 'products' и RLS политик
    const setupSqlPath = path.resolve(__dirname, "sql", "storage_setup.sql");
    const setupSql = fs.readFileSync(setupSqlPath, "utf8");
    logger.info("STORAGE_SETUP", "Создание публичного бакета 'products' и настройка политик...");
    await client.query(setupSql);
    logger.info("STORAGE_SETUP", "✅ Бакет 'products' успешно настроен и открыт для CDN");

    // 2. Выбираем товары, у которых картинки все еще ведут на ankorstore
    const res = await client.query(
      `SELECT id, main_image, images 
       FROM products 
       WHERE main_image LIKE '%ankorstore%' OR images::text LIKE '%ankorstore%'`
    );

    const productsToMigrate = res.rows;
    logger.info("MIGRATION", `Найдено ${productsToMigrate.length} товаров с внешними картинками Ankorstore`);

    if (productsToMigrate.length === 0) {
      logger.info("MIGRATION", "Все картинки уже перенесены на наш CDN!");
      await client.end();
      return;
    }

    const uploader = new ImageCdnUploader(logger);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsToMigrate.length; i++) {
      const prod = productsToMigrate[i];
      const rawImages: string[] = Array.isArray(prod.images)
        ? prod.images
        : typeof prod.images === "string"
        ? JSON.parse(prod.images)
        : [prod.main_image];

      logger.info(
        "ITEM_TRANSFER",
        `[${i + 1}/${productsToMigrate.length}] Перенос картинок для товара: ${prod.id}`
      );

      try {
        const { mainImage: newMain, images: newImages } = await uploader.transferProductGallery(
          prod.id,
          prod.main_image,
          rawImages
        );

        // Обновляем запись товара в базе данных
        await client.query(
          `UPDATE products 
           SET main_image = $1, images = $2, updated_at = NOW() 
           WHERE id = $3`,
          [newMain, JSON.stringify(newImages), prod.id]
        );

        successCount++;
        logger.info("ITEM_TRANSFER", `✅ Товар ${prod.id} переведен на наш CDN: ${newMain}`);
      } catch (err: any) {
        errorCount++;
        logger.error("ITEM_TRANSFER", `Ошибка переноса товара ${prod.id}: ${err.message}`);
      }
    }

    logger.info(
      "FINISH",
      `🏁 Перенос завершен! Успешно: ${successCount}, Ошибок: ${errorCount}`
    );

    await client.end();
  } catch (err: any) {
    logger.error("INIT", `Критическая ошибка: ${err.message}`);
    await client.end();
    process.exit(1);
  }
}

backfillImages();

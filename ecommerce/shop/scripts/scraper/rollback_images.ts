import path from "path";
import dotenv from "dotenv";
import { Client } from "pg";
import { ScraperLogger } from "./core/logger";

// Загружаем конфигурацию из .env.local и .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Скрипт мгновенного отката или возврата защищенных изображений:
 * 
 * Использование:
 *   npx tsx scripts/scraper/rollback_images.ts             (Откат: переключает витрину на чистые оригиналы original_main_image)
 *   npx tsx scripts/scraper/rollback_images.ts --to-opt    (Возврат: переключает витрину обратно на защищенные _opt.webp)
 */
async function toggleImages() {
  const isRestoreOpt = process.argv.includes("--to-opt");
  const logger = new ScraperLogger("image_rollback", "products");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    logger.error("FINISH", "В .env.local / .env не найден DATABASE_URL");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  logger.info(
    "FINISH",
    isRestoreOpt
      ? "Переключение витрины на защищенные изображения (_opt.webp)..."
      : "Откат витрины к исходным оригинальным изображениям..."
  );

  let updatedCount = 0;

  if (isRestoreOpt) {
    // Возвращаем _opt.webp ссылки
    const res = await client.query(
      `SELECT id, original_main_image, original_images FROM products WHERE original_main_image IS NOT NULL;`
    );

    for (const row of res.rows) {
      const origMain: string = row.original_main_image;
      const origGallery: string[] = Array.isArray(row.original_images) ? row.original_images : [];

      // Заменяем расширение на _opt.webp
      const optMain = origMain.includes("_opt.webp") ? origMain : origMain.replace(/\.(webp|jpg|jpeg|png)$/, "_opt.webp");
      const optGallery = origGallery.map((img) =>
        img.includes("_opt.webp") ? img : img.replace(/\.(webp|jpg|jpeg|png)$/, "_opt.webp")
      );

      await client.query(
        `UPDATE products SET main_image = $1, images = $2, updated_at = NOW() WHERE id = $3;`,
        [optMain, JSON.stringify(optGallery.length > 0 ? optGallery : [optMain]), row.id]
      );
      updatedCount++;
    }

    logger.info("FINISH", `🎉 Готово! Переключено на защищенные _opt.webp: ${updatedCount} товаров.`);
  } else {
    // Откатываем к оригинальным фото
    const res = await client.query(
      `UPDATE products 
       SET main_image = original_main_image, 
           images = original_images, 
           updated_at = NOW() 
       WHERE original_main_image IS NOT NULL AND main_image != original_main_image;`
    );
    updatedCount = res.rowCount || 0;
    logger.info("FINISH", `🎉 Готово! Возвращено к оригинальным чистым фото: ${updatedCount} товаров.`);
  }

  await client.end();
}

if (require.main === module) {
  toggleImages().catch((err) => {
    console.error("Ошибка отката изображений:", err);
    process.exit(1);
  });
}

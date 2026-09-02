import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { ScrapedProductRaw, ScrapedItemResult } from "./types";
import { ScraperLogger } from "./logger";

// Загружаем переменные окружения из .env.local и .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Хранилище данных парсера: поддержка прямого PostgreSQL пулера, Supabase REST API и локального JSON-бэкапа
 */
export class ScraperStorage {
  private supabase: SupabaseClient | null = null;
  private pgPool: Pool | null = null;
  private logger: ScraperLogger;
  private localBackupFilePath: string;

  constructor(logger: ScraperLogger) {
    this.logger = logger;
    this.localBackupFilePath = path.resolve(process.cwd(), "src", "data", "scraped_products.json");

    // 1. Инициализация прямого PostgreSQL подключения (если передан DATABASE_URL)
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    if (dbUrl) {
      try {
        this.pgPool = new Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false },
          max: 5,
        });
        this.logger.info("INIT", "Прямое подключение к PostgreSQL Supabase активно (DATABASE_URL)");
      } catch (pgErr) {
        this.logger.warn("INIT", "Не удалось создать PostgreSQL пул", { error: String(pgErr) });
      }
    }

    // 2. Инициализация Supabase REST API клиента
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.logger.info("INIT", `Supabase REST API подключен (${supabaseUrl})`);
      } catch (err) {
        this.logger.warn("INIT", "Не удалось инициализировать клиент Supabase REST API", { error: String(err) });
      }
    }

    if (!this.pgPool && !this.supabase) {
      this.logger.info(
        "INIT",
        "База данных не настроена. Все товары сохраняются в локальный JSON-дамп src/data/scraped_products.json."
      );
    }
  }

  /**
   * Создает стартовую запись сессии в таблице parsing_runs
   */
  public async createParsingRun(
    runId: string,
    source: string,
    sourceUrl: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    if (this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO parsing_runs (id, source, source_url, status, log_file_path, metadata)
           VALUES ($1, $2, $3, 'running', $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [runId, source, sourceUrl, this.logger.getLogFilePath(), JSON.stringify(metadata)]
        );
        this.logger.debug("INIT", `Сессия ${runId} зарегистрирована в parsing_runs (PostgreSQL)`);
        return;
      } catch (err) {
        this.logger.warn("INIT", "Ошибка записи сессии в PostgreSQL (возможно, таблицы еще не созданы)", {
          error: String(err),
        });
      }
    }

    if (this.supabase) {
      try {
        await this.supabase.from("parsing_runs").insert({
          id: runId,
          source,
          source_url: sourceUrl,
          status: "running",
          log_file_path: this.logger.getLogFilePath(),
          metadata,
        });
      } catch {
        // Игнорируем ошибку
      }
    }
  }

  /**
   * Обновляет статус и счетчики сессии парсинга
   */
  public async updateParsingRun(
    runId: string,
    status: "completed" | "failed" | "paused_captcha",
    scrapedCount: number,
    failedCount: number,
    totalFound: number,
    errorMessage?: string
  ): Promise<void> {
    if (this.pgPool) {
      try {
        await this.pgPool.query(
          `UPDATE parsing_runs 
           SET status = $1, items_scraped = $2, items_failed = $3, total_found = $4, error_message = $5, finished_at = NOW()
           WHERE id = $6`,
          [status, scrapedCount, failedCount, totalFound, errorMessage || null, runId]
        );
        return;
      } catch {
        // Игнорируем ошибку
      }
    }

    if (this.supabase) {
      try {
        await this.supabase
          .from("parsing_runs")
          .update({
            status,
            items_scraped: scrapedCount,
            items_failed: failedCount,
            total_found: totalFound,
            finished_at: new Date().toISOString(),
            error_message: errorMessage || null,
          })
          .eq("id", runId);
      } catch {
        // Игнорируем ошибку
      }
    }
  }

  /**
   * Сохраняет спарсенный товар с дедупликацией по EAN и созданием снапшота в product_sources
   */
  public async saveProduct(runId: string, raw: ScrapedProductRaw): Promise<ScrapedItemResult> {
    // 1. Всегда сохраняем локальный бэкап
    this.saveToLocalJsonBackup(raw);

    const slug = this.generateSlug(raw.title);
    const masterProductId = raw.ean ? `prod-${raw.ean}` : `prod-${slug.slice(0, 40)}`;

    // 2. Сохранение напрямую через PostgreSQL пул
    if (this.pgPool) {
      try {
        let existingId: string | null = null;
        let isExisting = false;

        // Дедупликация по EAN
        if (raw.ean) {
          const checkEan = await this.pgPool.query("SELECT id FROM products WHERE ean = $1 LIMIT 1", [raw.ean]);
          if (checkEan.rows.length > 0) {
            existingId = checkEan.rows[0].id;
            isExisting = true;
            this.logger.info(
              "DEDUPLICATION",
              `✨ Товар с EAN ${raw.ean} найден в PostgreSQL (ID: ${existingId}). Объединяем предложение!`,
              undefined,
              raw.sourceUrl
            );
          }
        }

        // Если по EAN не найден, проверяем по source_url в product_sources
        if (!existingId) {
          const checkUrl = await this.pgPool.query(
            "SELECT product_id FROM product_sources WHERE source_url = $1 LIMIT 1",
            [raw.sourceUrl]
          );
          if (checkUrl.rows.length > 0) {
            existingId = checkUrl.rows[0].product_id;
            isExisting = true;
          }
        }

        const targetMasterId = existingId || masterProductId;

        // Вставка или обновление мастер-товара в products
        if (!isExisting) {
          await this.pgPool.query(
            `INSERT INTO products (
              id, ean, slug, title_es, title_en, description_es, description_en,
              short_description_es, short_description_en, price, original_price,
              currency, category, brand, sku, main_image, images, specs, features,
              rating, review_count, in_stock, stock_count, primary_source
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20, $21, $22, $23, $24
            )`,
            [
              targetMasterId,
              raw.ean || null,
              `${slug}-${Date.now().toString().slice(-4)}`,
              raw.title,
              raw.title,
              raw.description,
              raw.description,
              raw.shortDescription || raw.description.slice(0, 150) + "...",
              raw.shortDescription || raw.description.slice(0, 150) + "...",
              raw.price,
              raw.originalPrice || Math.round(raw.price * 1.25 * 100) / 100,
              raw.currency || "EUR",
              raw.category || "workspace",
              raw.brand || "Generico",
              raw.sku || (raw.ean ? `SKU-${raw.ean}` : `SKU-${Date.now()}`),
              raw.mainImage,
              JSON.stringify(raw.images),
              JSON.stringify({ es: raw.specs || {}, en: raw.specs || {} }),
              JSON.stringify({ es: raw.features || [], en: raw.features || [] }),
              4.8,
              Math.floor(Math.random() * 20) + 5,
              true,
              Math.floor(Math.random() * 25) + 10,
              raw.sourceName,
            ]
          );
          this.logger.info("SAVE_MASTER", `Создан новый мастер-товар [ID: ${targetMasterId}] "${raw.title}" (PostgreSQL)`);
        } else {
          await this.pgPool.query("UPDATE products SET price = $1, updated_at = NOW() WHERE id = $2", [
            raw.price,
            targetMasterId,
          ]);
        }

        // Сохранение снапшота в product_sources
        await this.pgPool.query(
          `INSERT INTO product_sources (
            product_id, parsing_run_id, source_name, source_url, supplier_sku,
            supplier_brand, wholesale_price, retail_price, currency, in_stock, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            targetMasterId,
            runId,
            raw.sourceName,
            raw.sourceUrl,
            raw.sku || null,
            raw.brand || null,
            raw.wholesalePrice || null,
            raw.price,
            raw.currency || "EUR",
            true,
            JSON.stringify(raw.rawData),
          ]
        );

        return {
          url: raw.sourceUrl,
          success: true,
          ean: raw.ean,
          productId: targetMasterId,
          isExistingProduct: isExisting,
        };
      } catch (pgErr) {
        this.logger.error("SAVE_MASTER", `Ошибка сохранения в PostgreSQL: ${raw.title}`, pgErr, raw.sourceUrl);
      }
    }

    // 3. Fallback: возврат успеха локального сохранения
    return {
      url: raw.sourceUrl,
      success: true,
      ean: raw.ean,
      productId: masterProductId,
      isExistingProduct: false,
    };
  }

  /**
   * Запись в локальный JSON-файл для полной автономности
   */
  private saveToLocalJsonBackup(raw: ScrapedProductRaw): void {
    try {
      let catalog: Record<string, unknown>[] = [];
      const dir = path.dirname(this.localBackupFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.localBackupFilePath)) {
        const fileContent = fs.readFileSync(this.localBackupFilePath, "utf8");
        if (fileContent.trim()) {
          catalog = JSON.parse(fileContent);
        }
      }

      const existingIndex = catalog.findIndex((item: Record<string, unknown>) => {
        if (raw.ean && item.ean === raw.ean) return true;
        return item.sourceUrl === raw.sourceUrl;
      });

      const entry = {
        id: raw.ean ? `prod-${raw.ean}` : `prod-${this.generateSlug(raw.title).slice(0, 30)}`,
        slug: this.generateSlug(raw.title),
        title: { es: raw.title, en: raw.title },
        description: { es: raw.description, en: raw.description },
        shortDescription: {
          es: raw.shortDescription || raw.description.slice(0, 140) + "...",
          en: raw.shortDescription || raw.description.slice(0, 140) + "...",
        },
        price: raw.price,
        originalPrice: raw.originalPrice || Math.round(raw.price * 1.25 * 100) / 100,
        currency: raw.currency || "EUR",
        category: raw.category || "workspace",
        brand: raw.brand || "Ankorstore Supplier",
        sku: raw.sku || (raw.ean ? `SKU-${raw.ean}` : `SKU-${Date.now()}`),
        ean: raw.ean,
        mainImage: raw.mainImage,
        images: raw.images,
        specs: { es: raw.specs || {}, en: raw.specs || {} },
        features: { es: raw.features || [], en: raw.features || [] },
        rating: 4.8,
        reviewCount: 16,
        inStock: true,
        stockCount: 25,
        sourceUrl: raw.sourceUrl,
        sourceName: raw.sourceName,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        catalog[existingIndex] = entry;
      } else {
        catalog.push(entry);
      }

      fs.writeFileSync(this.localBackupFilePath, JSON.stringify(catalog, null, 2), "utf8");
    } catch (err) {
      this.logger.warn("LOCAL_BACKUP", "Ошибка при записи в локальный JSON-файл", { error: String(err) });
    }
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

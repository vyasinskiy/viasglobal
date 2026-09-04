import { Product, ProductCategory } from "@/types";
import { PRODUCTS_DATA } from "@/data/products";
import { supabase } from "./supabase";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Гарантируем загрузку .env.local даже в изолированных серверных контекстах
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Ленивая инициализация пула соединений с PostgreSQL для серверного рендеринга Next.js
let serverPgPool: Pool | null = null;
function getServerPgPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!serverPgPool && dbUrl) {
    try {
      serverPgPool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 5,
      });
    } catch {
      // Игнорируем в клиентском контексте
    }
  }
  return serverPgPool;
}

/**
 * Генерирует детерминированный реалистичный рейтинг и число отзывов для товара.
 * Для части случайных товаров (~65%) назначается разный высокий рейтинг (4.6 - 5.0) и отзывы,
 * а для части (~35%) товар считается новинкой без отзывов (0 отзывов).
 */
function getProductRatingAndReviews(
  id: string,
  existingRating?: number | string,
  existingReviews?: number | string
): { rating: number; reviewCount: number; isBestseller: boolean } {
  const parsedRating = existingRating ? Number(existingRating) : 0;
  const parsedReviews = existingReviews ? Number(existingReviews) : 0;

  // Вычисляем стабильный детерминированный хэш по ID товара, чтобы значения не мерцали
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  // Если в базе уже явно проставлен индивидуальный рейтинг, отличный от шаблонного 4.80
  if (parsedRating > 0 && parsedRating !== 4.8) {
    return {
      rating: parsedRating,
      reviewCount: parsedReviews > 0 ? parsedReviews : ((hash >>> 3) % 40) + 5,
      isBestseller: hash % 6 === 0,
    };
  }

  // Распределяем товары:
  // ~65% товаров имеют отзывы и разный реалистичный рейтинг
  // ~35% товаров — новинки без отзывов (reviewCount = 0)
  const hasReviews = (hash % 100) < 65;
  if (!hasReviews) {
    return { rating: 0, reviewCount: 0, isBestseller: false };
  }

  // Набор реалистичных оценок для качественного каталога
  const ratingVariations = [4.7, 4.8, 4.9, 5.0, 4.6, 4.8, 4.9, 4.7, 5.0, 4.9, 4.8];
  const rating = ratingVariations[hash % ratingVariations.length];

  // Разнообразное количество отзывов (от 5 до 79)
  const reviewCount = ((hash >>> 3) % 75) + 5;
  const isBestseller = (hash % 5 === 0) && rating >= 4.8;

  return { rating, reviewCount, isBestseller };
}

/**
 * Преобразует строку из базы данных Supabase / PostgreSQL в интерфейс Product витрины
 */
function mapDatabaseRowToProduct(row: any): Product {
  const images = Array.isArray(row.images)
    ? row.images
    : typeof row.images === "string"
    ? JSON.parse(row.images)
    : [row.main_image];

  const specs = typeof row.specs === "string" ? JSON.parse(row.specs) : row.specs || { es: {}, en: {} };
  const features = typeof row.features === "string" ? JSON.parse(row.features) : row.features || { es: [], en: [] };

  // Считываем точные значения рейтинга и отзывов из базы данных (или вычисляем детерминированно при их отсутствии)
  const dbRating = row.rating !== undefined && row.rating !== null ? Number(row.rating) : undefined;
  const dbReviews = row.review_count !== undefined && row.review_count !== null ? Number(row.review_count) : undefined;
  const fallback = dbRating === undefined ? getProductRatingAndReviews(row.id) : null;

  const finalRating = dbRating !== undefined ? dbRating : fallback!.rating;
  const finalReviewCount = dbReviews !== undefined ? dbReviews : fallback!.reviewCount;

  return {
    id: row.id,
    slug: row.slug,
    title: {
      es: row.title_es,
      en: row.title_en || row.title_es,
    },
    description: {
      es: row.description_es || "",
      en: row.description_en || row.description_es || "",
    },
    shortDescription: {
      es: row.short_description_es || row.description_es?.slice(0, 140) + "..." || "",
      en: row.short_description_en || row.description_en?.slice(0, 140) + "..." || "",
    },
    price: Number(row.price),
    distributorPrice: row.distributor_price ? Number(row.distributor_price) : undefined,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    currency: row.currency || "EUR",
    category: (row.category as ProductCategory) || "lifestyle",
    brand: row.brand || "Viasglobal",
    sku: row.sku || `SKU-${row.id}`,
    ean: row.ean || undefined,
    mainImage: row.main_image,
    images: images.length > 0 ? images : [row.main_image],
    rating: finalRating,
    reviewCount: finalReviewCount,
    inStock: Boolean(row.in_stock),
    stockCount: Number(row.stock_count) || 20,
    isBestseller: Boolean(row.is_bestseller),
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new) || finalReviewCount === 0,
    tags: Array.isArray(row.tags) ? row.tags : [],
    specs,
    features,
  };
}

/**
 * Читает локально сохраненные товары из JSON бэкапа (если база недоступна)
 */
function getLocalScrapedProducts(): Product[] {
  try {
    const backupPath = path.resolve(process.cwd(), "src", "data", "scraped_products.json");
    if (fs.existsSync(backupPath)) {
      const content = fs.readFileSync(backupPath, "utf8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed as Product[];
        }
      }
    }
  } catch {
    // В браузере fs недоступен, возвращаем пустой массив
  }
  return [];
}

/**
 * Получает каталог всех активных товаров магазина с поддержкой фильтрации по категории и тегу
 * Приоритет: 1) Прямой PostgreSQL пул -> 2) Supabase REST -> 3) Локальные спарсенные товары -> 4) Базовый каталог PRODUCTS_DATA
 */
export async function getStoreProducts(category?: ProductCategory, tag?: string): Promise<Product[]> {
  // 1. Попытка прямого запроса к PostgreSQL
  const pool = getServerPgPool();
  if (pool) {
    try {
      let sql = "SELECT * FROM products";
      const params: any[] = [];
      const conditions: string[] = [];

      if (category && category !== "all") {
        params.push(category);
        conditions.push(`category = $${params.length}`);
      }

      if (tag && tag.trim()) {
        params.push(tag.trim().toLowerCase());
        conditions.push(`$${params.length} = ANY(tags)`);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      sql += " ORDER BY created_at DESC";

      const res = await pool.query(sql, params);
      if (res.rows.length > 0) {
        return res.rows.map(mapDatabaseRowToProduct);
      }
    } catch (dbErr) {
      console.error("Ошибка при запросе к PostgreSQL:", dbErr);
      // Переходим к Supabase REST
    }
  }

  // 2. Попытка запроса к Supabase REST API
  if (supabase) {
    try {
      let query = supabase.from("products").select("*").order("created_at", { ascending: false });

      if (category && category !== "all") {
        query = query.eq("category", category);
      }

      if (tag && tag.trim()) {
        query = query.contains("tags", [tag.trim().toLowerCase()]);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map(mapDatabaseRowToProduct);
      }
    } catch {
      // Переходим к резервным источникам
    }
  }

  // 3. Резервный источник: спарсенные товары из JSON + статический каталог
  const localScraped = getLocalScrapedProducts();
  const allFallback = [...localScraped, ...PRODUCTS_DATA];

  // Убираем дубликаты по ID или EAN
  const seenIds = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const prod of allFallback) {
    if (!seenIds.has(prod.id)) {
      seenIds.add(prod.id);
      if (!category || category === "all" || prod.category === category) {
        uniqueProducts.push(prod);
      }
    }
  }

  return uniqueProducts;
}

/**
 * Поиск товара по slug ЧПУ
 */
export async function getStoreProductBySlug(slugOrId: string): Promise<Product | null> {
  const pool = getServerPgPool();
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT * FROM products WHERE slug = $1 OR id = $1 LIMIT 1",
        [slugOrId]
      );
      if (res.rows.length > 0) {
        return mapDatabaseRowToProduct(res.rows[0]);
      }
    } catch {
      // Fallback
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        .maybeSingle();
      if (!error && data) {
        return mapDatabaseRowToProduct(data);
      }
    } catch {
      // Fallback
    }
  }

  const all = await getStoreProducts();
  return all.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
}

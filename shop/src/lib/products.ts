import { Product, ProductCategory } from "@/types";
import { PRODUCTS_DATA } from "@/data/products";
import { supabase } from "./supabase";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Инициализация пула соединений с PostgreSQL для серверного рендеринга Next.js
let serverPgPool: Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    serverPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  } catch {
    // В клиентском контексте игнорируем
  }
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
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    currency: row.currency || "EUR",
    category: (row.category as ProductCategory) || "lifestyle",
    brand: row.brand || "Viasglobal",
    sku: row.sku || `SKU-${row.id}`,
    ean: row.ean || undefined,
    mainImage: row.main_image,
    images: images.length > 0 ? images : [row.main_image],
    rating: Number(row.rating) || 4.8,
    reviewCount: Number(row.review_count) || 12,
    inStock: Boolean(row.in_stock),
    stockCount: Number(row.stock_count) || 20,
    isBestseller: Boolean(row.is_bestseller),
    isFeatured: Boolean(row.is_featured),
    isNew: Boolean(row.is_new),
    specs,
    features,
  };
}

/**
 * Загружает спарсенные товары из локального файла бэкапа (если есть)
 */
function getLocalScrapedProducts(): Product[] {
  try {
    const filePath = path.resolve(process.cwd(), "src", "data", "scraped_products.json");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
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
 * Получает каталог всех активных товаров магазина
 * Приоритет: 1) Прямой PostgreSQL пул -> 2) Supabase REST -> 3) Локальные спарсенные товары -> 4) Базовый каталог PRODUCTS_DATA
 */
export async function getStoreProducts(category?: ProductCategory): Promise<Product[]> {
  // 1. Попытка прямого запроса к PostgreSQL
  if (serverPgPool) {
    try {
      let sql = "SELECT * FROM products";
      const params: any[] = [];
      if (category && category !== "all") {
        sql += " WHERE category = $1";
        params.push(category);
      }
      sql += " ORDER BY created_at DESC";

      const res = await serverPgPool.query(sql, params);
      if (res.rows.length > 0) {
        return res.rows.map(mapDatabaseRowToProduct);
      }
    } catch {
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
export async function getStoreProductBySlug(slug: string): Promise<Product | null> {
  if (serverPgPool) {
    try {
      const res = await serverPgPool.query("SELECT * FROM products WHERE slug = $1 LIMIT 1", [slug]);
      if (res.rows.length > 0) {
        return mapDatabaseRowToProduct(res.rows[0]);
      }
    } catch {
      // Fallback
    }
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (!error && data) {
        return mapDatabaseRowToProduct(data);
      }
    } catch {
      // Fallback
    }
  }

  const all = await getStoreProducts();
  return all.find((p) => p.slug === slug || p.id === slug) || null;
}

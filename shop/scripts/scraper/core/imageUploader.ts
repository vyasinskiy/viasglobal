import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ScraperLogger } from "./logger";
import { transformImageAntiSearch } from "./imageTransformer";

// Загружаем переменные окружения
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Сервис для скачивания изображений товаров поставщиков и их загрузки в наш собственный CDN (Supabase Storage)
 */
export class ImageCdnUploader {
  private supabase: SupabaseClient | null = null;
  private logger: ScraperLogger;
  private bucketName = "products";
  private supabaseUrl: string;

  constructor(logger: ScraperLogger) {
    this.logger = logger;
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yzaarsfeztkkzuexhivl.supabase.co";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "";

    if (this.supabaseUrl && supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, supabaseKey);
    }
  }

  /**
   * Возвращает публичный CDN URL для файла в бакете
   */
  public getPublicCdnUrl(filePath: string): string {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;
  }

  /**
   * Скачивает изображение по внешнему URL и загружает его в наш Supabase CDN
   * @param externalUrl Ссылка на внешнее изображение (например, img.ankorstore.com)
   * @param productId Уникальный ID товара для организации структуры папок
   * @param index Порядковый номер фото в галерее (0 для главного)
   * @returns Новый URL изображения на нашем CDN
   */
  public async transferImageToCdn(
    externalUrl: string,
    productId: string,
    index: number = 0
  ): Promise<string | null> {
    // Если ссылка уже на нашем CDN, не скачиваем повторно
    if (externalUrl.includes(this.supabaseUrl) || externalUrl.startsWith("/")) {
      return externalUrl;
    }

    if (!this.supabase) {
      this.logger.warn("CDN_UPLOAD", "Supabase клиент не инициализирован, оставляем внешнюю ссылку", undefined, externalUrl);
      return externalUrl;
    }

    try {
      // 1. Скачиваем изображение с внешнего сервера
      const response = await fetch(externalUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        this.logger.warn(
          "CDN_UPLOAD",
          `Не удалось скачать изображение (HTTP ${response.status}): ${externalUrl}`
        );
        return null;
      }

      const contentType = response.headers.get("content-type") || "image/webp";
      const rawBuffer = Buffer.from(await response.arrayBuffer());

      // Определяем расширение оригинала
      let rawExt = "webp";
      if (contentType.includes("jpeg") || contentType.includes("jpg")) rawExt = "jpg";
      else if (contentType.includes("png")) rawExt = "png";
      else if (contentType.includes("svg")) rawExt = "svg";

      const sanitizedId = productId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const hash = crypto.createHash("md5").update(externalUrl).digest("hex").slice(0, 8);

      // 2. Сохраняем оригинал в Supabase Storage (без искажений)
      const originalPath = `${sanitizedId}/img_${index}_${hash}.${rawExt}`;
      const { error: origUploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(originalPath, rawBuffer, {
          contentType,
          upsert: true,
        });

      if (origUploadError) {
        this.logger.warn("CDN_UPLOAD", `Ошибка загрузки оригинала в Supabase Storage: ${origUploadError.message}`, undefined, externalUrl);
      }

      const originalCdnUrl = this.getPublicCdnUrl(originalPath);

      // 3. Применяем анти-поисковую обработку и сохраняем с неявным суффиксом _opt (optimized)
      let optBuffer = rawBuffer;
      let optContentType = "image/webp";
      const optPath = `${sanitizedId}/img_${index}_${hash}_opt.webp`;

      try {
        const transformed = await transformImageAntiSearch(rawBuffer);
        optBuffer = Buffer.from(transformed);
        optContentType = "image/webp";
      } catch (transformErr: any) {
        this.logger.warn(
          "CDN_UPLOAD",
          `Ошибка трансформации анти-поиска: ${transformErr.message}, оставляем оригинал`,
          undefined,
          externalUrl
        );
        optContentType = contentType;
      }

      const { error: optUploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(optPath, optBuffer, {
          contentType: optContentType,
          upsert: true,
        });

      if (optUploadError) {
        this.logger.warn("CDN_UPLOAD", `Ошибка при загрузке обработанного файла: ${optUploadError.message}`, undefined, externalUrl);
        return originalCdnUrl;
      }

      const optCdnUrl = this.getPublicCdnUrl(optPath);
      this.logger.debug("CDN_UPLOAD", `Оригинал сохранен: ${originalCdnUrl}, витринная версия _opt: ${optCdnUrl}`);
      return optCdnUrl;
    } catch (err: any) {
      this.logger.warn("CDN_UPLOAD", `Исключение при переносе картинки: ${err.message}`, undefined, externalUrl);
      return null;
    }
  }

  /**
   * Пакетный перенос всех картинок товара (главная + галерея) на наш CDN
   */
  public async transferProductGallery(
    productId: string,
    mainImage: string,
    images: string[]
  ): Promise<{ mainImage: string; images: string[]; originalMainImage?: string; originalImages?: string[] }> {
    const newMain = await this.transferImageToCdn(mainImage, productId, 0);

    const newImages: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const url = images[i];
      const newUrl = await this.transferImageToCdn(url, productId, i);
      if (newUrl) {
        newImages.push(newUrl);
      }
    }

    const fallbackMain = newMain || (newImages.length > 0 ? newImages[0] : "/images/placeholder.webp");

    return {
      mainImage: fallbackMain,
      images: newImages.length > 0 ? newImages : [fallbackMain],
      originalMainImage: mainImage,
      originalImages: images.length > 0 ? images : [mainImage],
    };
  }
}

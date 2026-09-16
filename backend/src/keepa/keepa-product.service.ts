import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import {
  KeepaQueueService,
  KEEPA_PRIORITY,
  KeepaRequestQueueJob,
  ProductAsinsPayload,
} from './keepa-queue.service';
import { KeepaRequestType } from '@prisma/client';

@Injectable()
export class KeepaProductService {
  private readonly logger = new Logger(KeepaProductService.name);

  // Идентификатор маркетплейса Keepa (4 = amazon.es)
  private readonly defaultDomainId = 4;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
    private readonly queueService: KeepaQueueService,
  ) {}

  /**
   * Заполняет очередь ASINов из WholesaleCandidatesView
   * Этот метод можно вызывать по крону раз в сутки или вручную через API
   */
  async populateQueue() {
    this.logger.log('Начинаем массовое обновление очереди ASIN из WholesaleCandidatesView...');

    try {
      // Единый SQL-запрос для распаковки строки ASIN, фильтрации и вставки (UPSERT)
      const result = await this.prisma.$executeRaw`
        WITH unnested_asins AS (
          SELECT 
            TRIM(unnest(string_to_array(asins, ','))) AS asin,
            "asinCount" AS priority
          FROM public."WholesaleCandidatesView"
          WHERE asins IS NOT NULL AND asins != ''
        ),
        filtered_asins AS (
          SELECT 
            u.asin,
            MAX(u.priority) as priority
          FROM unnested_asins u
          LEFT JOIN "KeepaApiRawResponse" r ON u.asin = r.asin
          -- Фильтруем: берем только те ASIN, которых еще нет в ответах, либо их срок годности истек
          WHERE r.asin IS NULL OR (r."expiresAt" IS NOT NULL AND r."expiresAt" < NOW())
          GROUP BY u.asin
        )
        INSERT INTO "RequestProductQueue" (asin, priority, "addedAt")
        SELECT asin, priority, NOW() 
        FROM filtered_asins
        ON CONFLICT (asin) 
        DO UPDATE SET 
          priority = EXCLUDED.priority,
          "addedAt" = EXCLUDED."addedAt";
      `;

      this.logger.log(`Очередь успешно обновлена мощным SQL-запросом. Затронуто записей: ${result}`);
    } catch (error: any) {
      this.logger.error(`Ошибка при массовом обновлении очереди: ${error.message}`);
    }
  }

  /**
   * Вычисляет размер пачки товаров (ASIN / EAN) для запроса к эндпоинту /product
   * на основе доступного лимита токенов в минуту и стоимости запроса товара.
   * Базовый запрос продукта = 1 токен.
   * Запрос с offers=20 стоит дороже (например, +2 токена).
   */
  public calculateProductsBatchRequestLimit(): number {
    const tokensPerMinute = parseInt(process.env.KEEPA_API_TOKENS_PER_MINUTE || '1', 10);
    let costPerAsin = 1; // Базовая стоимость одного продукта

    if (process.env.KEEPA_FETCH_OFFERS === 'true') {
      // По документации Keepa, offers добавляет стоимость (offers=20 добавляет 2 токена)
      costPerAsin += 2;
    }

    // Возвращаем количество товаров, которое мы можем позволить себе запросить за 1 минуту
    return Math.max(1, Math.floor(tokensPerMinute / costPerAsin));
  }

  /**
   * Постановка следующей пачки оптовых ASIN в очередь KeepaRequestQueue (раз в минуту по крону)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async enqueueNextWholesaleAsins() {
    if (process.env.APP_ENV === 'development') {
      this.logger.debug('Локальное окружение (development): крон enqueueNextWholesaleAsins отключен');
      return;
    }

    const limit = this.calculateProductsBatchRequestLimit();

    // Ищем ASIN с максимальным приоритетом, для которого нет записи в RawResponse или она устарела (expiresAt < now)
    const result: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT q.asin
      FROM "RequestProductQueue" q
      LEFT JOIN "KeepaApiRawResponse" r ON q.asin = r.asin
      WHERE r.asin IS NULL OR (r."expiresAt" IS NOT NULL AND r."expiresAt" < NOW())
      ORDER BY q.priority DESC, q."addedAt" ASC
      LIMIT $1
    `, limit);

    if (result.length === 0) {
      this.logger.debug('Нет ASIN в очереди для обновления.');
      return;
    }

    const asinsToFetch = result.map(r => r.asin);
    const hasOffers = process.env.KEEPA_FETCH_OFFERS === 'true';
    const cost = (hasOffers ? 3 : 1) * asinsToFetch.length;

    const asinsPayload: ProductAsinsPayload = {
      asins: asinsToFetch,
      offers: hasOffers,
    };

    // Ставим задачу в персистентную очередь запросов с фоновым приоритетом NORMAL
    await this.queueService.enqueueRequest(
      KeepaRequestType.PRODUCT_ASINS,
      asinsPayload,
      KEEPA_PRIORITY.NORMAL,
      cost,
    );
  }

  /**
   * Обработчик сырых данных (раз в минуту)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processRawData() {
    if (process.env.APP_ENV === 'development') {
      this.logger.debug('Локальное окружение (development): крон processRawData отключен');
      return;
    }

    const limit = this.calculateProductsBatchRequestLimit();
    // Берем пачку непроцесснутых ответов
    const rawResponses = await this.prisma.keepaApiRawResponse.findMany({
      where: { isProcessed: false, error: null },
      take: limit,
    });

    if (rawResponses.length === 0) return;

    for (const raw of rawResponses) {
      const payload: any = raw.rawPayload;
      const product = payload?.products?.[0];

      if (!product) {
        // Нет данных по продукту, помечаем как обработано с ошибкой
        await this.prisma.keepaApiRawResponse.update({
          where: { asin: raw.asin },
          data: { isProcessed: true, error: 'Product not found in payload' },
        });
        continue;
      }

      // Вызываем обработчик разбора продукта
      await this.processRawProduct(raw.asin, product);
    }
  }

  /**
   * Разбор и сохранение чистовых характеристик товара в KeepaApiProcessedData
   */
  public async processRawProduct(asin: string, product: any) {
    const pLength = product.packageLength || null;
    const pWidth = product.packageWidth || null;
    const pHeight = product.packageHeight || null;
    const pWeight = product.packageWeight || null;

    const iLength = product.itemLength || null;
    const iWidth = product.itemWidth || null;
    const iHeight = product.itemHeight || null;
    const iWeight = product.itemWeight || null;

    const targetLength = pLength || iLength;
    const targetWidth = pWidth || iWidth;
    const targetHeight = pHeight || iHeight;
    const targetWeight = pWeight || iWeight;

    const sizeTier = this.calculateAmazonTier(targetLength, targetWidth, targetHeight, targetWeight);

    let pickAndPackFee = null;
    if (product.fbaFees && product.fbaFees.pickAndPackFee) {
      pickAndPackFee = product.fbaFees.pickAndPackFee / 100;
    }

    let currentSalesRank = null;
    let avg90SalesRank = null;
    if (product.stats) {
      currentSalesRank = product.stats.current?.[3] ?? null;
      avg90SalesRank = product.stats.avg90?.[3] ?? null;
    }

    const processedData = {
      title: product.title || null,
      brand: product.brand || null,
      manufacturer: product.manufacturer || null,
      model: product.model || null,
      color: product.color || null,
      size: product.size || null,
      style: product.style || null,
      pattern: product.pattern || null,
      material: product.material || null,
      itemType: product.itemType || null,
      brandStoreName: product.brandStoreName || null,
      brandStoreUrlName: product.brandStoreUrlName || null,
      isAdultProduct: product.isAdultProduct ?? null,
      isHeatSensitive: product.isHeatSensitive ?? null,
      isEligibleForTradeIn: product.isEligibleForTradeIn ?? null,
      hasReviews: product.hasReviews ?? null,
      packageLength: pLength,
      packageWidth: pWidth,
      packageHeight: pHeight,
      packageWeight: pWeight,
      itemLength: iLength,
      itemWidth: iWidth,
      itemHeight: iHeight,
      itemWeight: iWeight,
      sizeTier: sizeTier,
      pickAndPackFee: pickAndPackFee,
      referralFeePercent: product.referralFeePercent ?? null,
      monthlySold: product.monthlySold || null,
      currentSalesRank: currentSalesRank,
      avg90SalesRank: avg90SalesRank,
      rootCategory: product.rootCategory ? String(product.rootCategory) : null,
      categoryTree: product.categoryTree ? (product.categoryTree as Prisma.InputJsonValue) : Prisma.DbNull,
      eanList: product.eanList || [],
      upcList: product.upcList || [],
      gtinList: product.gtinList || [],
      features: product.features || [],
      images: product.images ? (product.images as Prisma.InputJsonValue) : Prisma.DbNull,
      offers: product.offers ? (product.offers as Prisma.InputJsonValue) : Prisma.DbNull,
      buyBoxSellerIdHistory: product.buyBoxSellerIdHistory ? (product.buyBoxSellerIdHistory as Prisma.InputJsonValue) : Prisma.DbNull,
      buyBoxEligibleOfferCounts: product.buyBoxEligibleOfferCounts ? (product.buyBoxEligibleOfferCounts as Prisma.InputJsonValue) : Prisma.DbNull,
      variationCSV: product.variationCSV || (Array.isArray(product.variations) ? product.variations.map((v: any) => v.asin).join(',') : null),
      lastProcessedAt: new Date(),
    };

    await this.prisma.keepaApiProcessedData.upsert({
      where: { asin },
      update: processedData,
      create: {
        asin,
        ...processedData,
      },
    });

    await this.prisma.keepaApiRawResponse.update({
      where: { asin },
      data: { isProcessed: true },
    });

    // Очередь на анализ вариаций
    await this.analysisService.queueForAnalysis(asin, 0);
  }

  /**
   * Вспомогательный метод для определения FBA Size Tier по габаритам (мм) и весу (г)
   */
  public calculateAmazonTier(lengthMm: number | null, widthMm: number | null, heightMm: number | null, weightG: number | null): string | null {
    if (!lengthMm || !widthMm || !heightMm || !weightG) return null;

    const sides = [lengthMm / 10, widthMm / 10, heightMm / 10].sort((a, b) => b - a);
    const [lCm, wCm, hCm] = sides;
    const kg = weightG / 1000;

    if (lCm <= 20 && wCm <= 15 && hCm <= 1 && kg <= 0.08) return 'Small envelope';
    if (lCm <= 33 && wCm <= 23 && hCm <= 2.5 && kg <= 0.46) return 'Standard envelope';
    if (lCm <= 33 && wCm <= 23 && hCm <= 5 && kg <= 0.96) return 'Large envelope';
    if (lCm <= 45 && wCm <= 34 && hCm <= 26 && kg <= 11.9) return 'Standard parcel';
    if (lCm <= 61 && wCm <= 46 && hCm <= 46 && kg <= 1.76) return 'Small Oversize';
    if (lCm <= 120 && wCm <= 60 && hCm <= 60 && kg <= 29.76) return 'Standard Oversize';
    if (kg <= 31.5) return 'Large Oversize';

    return 'Special Oversize';
  }

  /**
   * Формирует базовый URL для запросов к Keepa API
   */
  public buildKeepaApiUrl(endpoint: string, domainId?: number): string | null {
    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) return null;

    const domain = domainId || this.defaultDomainId;
    return `https://api.keepa.com/${endpoint}?key=${apiKey}&domain=${domain}`;
  }

  /**
   * Обработчик запроса карточек товаров (PRODUCT_ASINS) через эндпоинт /product
   */
  public async handleProductAsinsJob(job: KeepaRequestQueueJob): Promise<{ totalAsins: number; processedCount: number }> {
    const { asins, offers, domainId } = job.payload as unknown as ProductAsinsPayload;
    const baseUrl = this.buildKeepaApiUrl('product', domainId);
    if (!baseUrl) throw new Error('Не удалось сформировать URL к Keepa API');

    let url = `${baseUrl}&asin=${asins.join(',')}`;
    if (offers) {
      url += '&offers=20';
    }

    const response = await fetch(url);
    const data = await response.json();

    // Синхронизируем статус токенов с сервисом очереди
    this.queueService.updateTokensInfo(data.tokensLeft, data.refillRate);

    if (data.error) {
      throw new Error(`Ошибка Keepa API: ${JSON.stringify(data.error)}`);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // Кэшируем на 14 дней

    let processedCount = 0;
    for (const asin of asins) {
      const product = data.products?.find((p: any) => p.asin === asin);
      if (!product) {
        await this.prisma.keepaApiRawResponse.upsert({
          where: { asin },
          update: { error: 'Not found in Keepa response', isProcessed: false, fetchedAt: new Date(), expiresAt },
          create: { asin, error: 'Not found in Keepa response', fetchedAt: new Date(), expiresAt, isProcessed: false },
        });
        continue;
      }

      // Сохраняем сырой ответ
      const payload = { ...data, products: [product] };
      await this.prisma.keepaApiRawResponse.upsert({
        where: { asin },
        update: {
          rawPayload: payload as any,
          fetchedAt: new Date(),
          expiresAt,
          isProcessed: false,
          error: null,
        },
        create: {
          asin,
          rawPayload: payload as any,
          fetchedAt: new Date(),
          expiresAt,
          isProcessed: false,
          error: null,
        },
      });

      // Передаем сырой продукт на разбор и сохранение
      await this.processRawProduct(asin, product);
      processedCount++;
    }

    return { totalAsins: asins.length, processedCount };
  }
}

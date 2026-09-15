import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KeepaRequestType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import {
  KeepaQueueService,
  KEEPA_PRIORITY,
  ProductFinderOptions,
  KeepaRequestQueueJob,
  ProductAsinsPayload,
  CategoryFinderPayload,
  BrandFinderPayload,
  SellerFinderPayload,
} from './keepa-queue.service';

@Injectable()
export class KeepaService {
  private readonly logger = new Logger(KeepaService.name);

  // Идентификатор маркетплейса Keepa (4 = amazon.es)
  private readonly defaultDomainId = 4;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
    private readonly queueService: KeepaQueueService,
  ) { }

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
        INSERT INTO "WholesaleAsinQueue" (asin, priority, "addedAt")
        SELECT asin, priority, NOW() 
        FROM filtered_asins
        ON CONFLICT (asin) 
        DO UPDATE SET 
          priority = EXCLUDED.priority,
          "addedAt" = EXCLUDED."addedAt";
      `;

      this.logger.log(`Очередь успешно обновлена мощным SQL-запросом. Затронуто записей: ${result}`);
    } catch (error) {
      this.logger.error(`Ошибка при массовом обновлении очереди: ${error.message}`);
    }
  }

  /**
   * Вычисляет размер пачки ASIN для запроса на основе стоимости токенов Keepa API.
   * Базовый запрос продукта = 1 токен.
   * Запрос с offers=20 стоит дороже (например, +2 токена).
   */
  private calculateKeepaBatchSize(): number {
    const tokensPerMinute = parseInt(process.env.KEEPA_API_TOKENS_PER_MINUTE || '1', 10);
    let costPerAsin = 1; // Базовая стоимость

    if (process.env.KEEPA_FETCH_OFFERS === 'true') {
      // По документации Keepa, offers добавляет стоимость. Предположим offers=20 добавляет 2 токена.
      costPerAsin += 2;
    }

    // Возвращаем количество ASIN, которое мы можем позволить себе запросить за 1 минуту
    return Math.max(1, Math.floor(tokensPerMinute / costPerAsin));
  }

  /**
   * Сборщик сырых данных (раз в минуту)
   * Берет очередную пачку ASIN и создает задачу в персистентной очереди KeepaRequestQueue
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async fetchRawData() {
    if (process.env.APP_ENV === 'development') {
      this.logger.debug('Локальное окружение (development): крон fetchRawData отключен');
      return;
    }

    const limit = this.calculateKeepaBatchSize();

    // Ищем ASIN с максимальным приоритетом, для которого нет записи в RawResponse или она устарела (expiresAt < now)
    const result: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT q.asin
      FROM "WholesaleAsinQueue" q
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
    const cost = hasOffers ? 3 : 1;

    // Ставим задачу в персистентную очередь запросов с обычным приоритетом
    await this.queueService.enqueueRequest(
      KeepaRequestType.PRODUCT_ASINS,
      { asins: asinsToFetch, offers: hasOffers },
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

    const limit = this.calculateKeepaBatchSize();
    // Берем пачку непроцесснутых ответов
    const rawResponses = await this.prisma.keepaApiRawResponse.findMany({
      where: { isProcessed: false, error: null },
      take: limit
    });

    if (rawResponses.length === 0) return;

    for (const raw of rawResponses) {
      const payload: any = raw.rawPayload;
      const product = payload?.products?.[0];

      if (!product) {
        // Нет данных по продукту, помечаем как обработано с ошибкой
        await this.prisma.keepaApiRawResponse.update({
          where: { asin: raw.asin },
          data: { isProcessed: true, error: 'Product not found in payload' }
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
   * Запрос к Keepa Product Finder API с динамической категорией и безопасными фильтрами
   * Создает задачу в персистентной очереди KeepaRequestQueue с низким приоритетом (LOW)
   */
  async fetchAndSaveKeepaExportForCategory(categoryId: string, options?: ProductFinderOptions) {
    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.CATEGORY_FINDER,
      { categoryId, options },
      KEEPA_PRIORITY.LOW,
      1,
    );

    return { jobId: job.id, message: `Задача поиска по категории ${categoryId} добавлена в очередь` };
  }

  /**
   * Запуск выгрузки по всем активным разрешенным категориям из базы данных
   */
  async fetchAndSaveKeepaExportForAllCategories(options?: Omit<ProductFinderOptions, 'domainId'>) {
    this.logger.log('Получаем список активных разрешенных категорий из базы данных...');

    // Выбираем только активные категории из таблицы KeepaAllowedCategory
    const categories = await this.prisma.keepaAllowedCategory.findMany({
      where: { isActive: true }
    });

    if (categories.length === 0) {
      this.logger.warn('В базе данных нет активных категорий в таблице KeepaAllowedCategory.');
      return [];
    }

    this.logger.log(`Найдено активных категорий: ${categories.length}. Добавляем задачи в очередь...`);
    const results = [];

    for (const cat of categories) {
      const res = await this.fetchAndSaveKeepaExportForCategory(cat.categoryId, {
        ...options,
        domainId: cat.domainId
      });

      results.push({
        categoryId: cat.categoryId,
        categoryName: cat.name,
        ...res
      });
    }

    return results;
  }

  /**
   * Экспорт каталога бренда из Keepa Product Finder через персистентную очередь (HIGH)
   */
  async fetchAndSaveKeepaExportForBrand(brandId: number, brandName: string, options?: ProductFinderOptions) {
    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.BRAND_FINDER,
      { brandId, brandName, options },
      KEEPA_PRIORITY.HIGH,
      1,
    );

    return { jobId: job.id, message: `Задача выгрузки бренда ${brandName} добавлена в очередь` };
  }

  /**
   * Экспорт витрины продавца из Keepa Product Finder через персистентную очередь (HIGH)
   */
  async fetchAndSaveKeepaExportForSeller(sellerId: string, options?: ProductFinderOptions) {
    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.SELLER_FINDER,
      { sellerId, options },
      KEEPA_PRIORITY.HIGH,
      1,
    );

    return { jobId: job.id, message: `Задача выгрузки продавца ${sellerId} добавлена в очередь` };
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
   * Непосредственное выполнение запроса к Keepa API и диспетчеризация обработчика
   */
  public async executeJob(job: KeepaRequestQueueJob): Promise<any> {
    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) {
      throw new Error('KEEPA_API_KEY не установлен в переменных окружения.');
    }

    switch (job.type) {
      case KeepaRequestType.PRODUCT_ASINS:
        return this.handleProductAsinsJob(job);

      case KeepaRequestType.CATEGORY_FINDER:
        return this.handleCategoryFinderJob(job);

      case KeepaRequestType.BRAND_FINDER:
        return this.handleBrandFinderJob(job);

      case KeepaRequestType.SELLER_FINDER:
        return this.handleSellerFinderJob(job);

      default:
        throw new Error(`Неизвестный тип задачи: ${job.type}`);
    }
  }

  /**
   * Обработчик запроса карточек товаров (PRODUCT_ASINS)
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

  /**
   * Обработчик поиска по категории (CATEGORY_FINDER)
   */
  public async handleCategoryFinderJob(job: KeepaRequestQueueJob): Promise<{ categoryId: string; totalFound: number; queued: number }> {
    const { categoryId, options } = job.payload as unknown as CategoryFinderPayload;
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) throw new Error('Не удалось сформировать URL к Keepa API');

    const payload = {
      productType: [0],
      current_SALES_gte: options?.salesRankGte ?? 1,
      current_SALES_lte: options?.salesRankLte ?? 50000,
      current_BUY_BOX_SHIPPING_gte: options?.buyBoxGte ?? 1500,
      current_BUY_BOX_SHIPPING_lte: options?.buyBoxLte ?? 10000,
      current_COUNT_NEW_gte: options?.countNewGte ?? 5,
      current_COUNT_NEW_lte: options?.countNewLte ?? 15,
      rootCategory: [categoryId],
      isAdultProduct: false,
      sort: [
        ['current_SALES', 'asc'],
        ['monthlySold', 'desc'],
      ],
      perPage: options?.perPage ?? 5000,
      page: options?.page ?? 0,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    // Синхронизируем статус токенов с сервисом очереди
    this.queueService.updateTokensInfo(data.tokensLeft, data.refillRate);

    if (data.error) {
      throw new Error(`Ошибка Keepa API: ${JSON.stringify(data.error)}`);
    }

    const asins: string[] = data.asinList || [];
    let queued = 0;
    for (const asin of asins) {
      try {
        await this.prisma.wholesaleAsinQueue.upsert({
          where: { asin },
          update: {},
          create: {
            asin,
            priority: 10,
            addedAt: new Date(),
          },
        });
        queued++;
      } catch (err: any) {
        this.logger.debug(`Пропуск ASIN ${asin}: ${err.message}`);
      }
    }

    return { categoryId, totalFound: data.totalResults || 0, queued };
  }

  /**
   * Обработчик поиска по бренду (BRAND_FINDER)
   */
  public async handleBrandFinderJob(job: KeepaRequestQueueJob): Promise<{ brandId: number; totalFound: number; queued: number; keepaExportId: number }> {
    const { brandId, brandName, options } = job.payload as unknown as BrandFinderPayload;
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) throw new Error('Не удалось сформировать URL к Keepa API');

    const payload = {
      productType: [0],
      brand: [brandName],
      current_SALES_gte: options?.salesRankGte ?? 1,
      current_SALES_lte: options?.salesRankLte ?? 50000,
      current_BUY_BOX_SHIPPING_gte: options?.buyBoxGte ?? 1500,
      current_BUY_BOX_SHIPPING_lte: options?.buyBoxLte ?? 10000,
      current_COUNT_NEW_gte: options?.countNewGte ?? 5,
      current_COUNT_NEW_lte: options?.countNewLte ?? 15,
      isAdultProduct: false,
      sort: [['current_SALES', 'asc'], ['monthlySold', 'desc']],
      perPage: options?.perPage ?? 5000,
      page: options?.page ?? 0,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    // Синхронизируем статус токенов с сервисом очереди
    this.queueService.updateTokensInfo(data.tokensLeft, data.refillRate);

    if (data.error) throw new Error(`Ошибка Keepa API: ${JSON.stringify(data.error)}`);

    const asins: string[] = data.asinList || [];
    const keepaExport = await this.prisma.keepaExport.create({
      data: { brandId },
    });

    let queuedCount = 0;
    for (const asinCode of asins) {
      try {
        await this.prisma.aSIN.upsert({
          where: { code: asinCode },
          create: {
            code: asinCode,
            keepaExports: { connect: { id: keepaExport.id } },
          },
          update: {
            keepaExports: { connect: { id: keepaExport.id } },
          },
        });

        await this.prisma.wholesaleAsinQueue.upsert({
          where: { asin: asinCode },
          update: {},
          create: { asin: asinCode, priority: 15, addedAt: new Date() },
        });
        queuedCount++;
      } catch (e: any) {
        this.logger.debug(`Ошибка сохранения ASIN ${asinCode}: ${e.message}`);
      }
    }

    return { brandId, totalFound: data.totalResults || 0, queued: queuedCount, keepaExportId: keepaExport.id };
  }

  /**
   * Обработчик поиска по витрине продавца (SELLER_FINDER)
   */
  public async handleSellerFinderJob(job: KeepaRequestQueueJob): Promise<{ sellerId: string; totalFound: number; queued: number; keepaExportId: number }> {
    const { sellerId, options } = job.payload as unknown as SellerFinderPayload;
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) throw new Error('Не удалось сформировать URL к Keepa API');

    const payload = {
      productType: [0],
      buyBoxSellerId: [sellerId],
      current_BUY_BOX_SHIPPING_gte: 0,
      sort: [['current_SALES', 'asc'], ['monthlySold', 'desc']],
      perPage: options?.perPage ?? 5000,
      page: options?.page ?? 0,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    // Синхронизируем статус токенов с сервисом очереди
    this.queueService.updateTokensInfo(data.tokensLeft, data.refillRate);

    if (data.error) throw new Error(`Ошибка Keepa API: ${JSON.stringify(data.error)}`);

    const asins: string[] = data.asinList || [];
    const keepaExport = await this.prisma.keepaExport.create({
      data: { sellerId },
    });

    let queuedCount = 0;
    for (const asinCode of asins) {
      try {
        await this.prisma.aSIN.upsert({
          where: { code: asinCode },
          create: {
            code: asinCode,
            keepaExports: { connect: { id: keepaExport.id } },
          },
          update: {
            keepaExports: { connect: { id: keepaExport.id } },
          },
        });

        await this.prisma.wholesaleAsinQueue.upsert({
          where: { asin: asinCode },
          update: {},
          create: { asin: asinCode, priority: 15, addedAt: new Date() },
        });
        queuedCount++;
      } catch (e: any) {
        this.logger.debug(`Ошибка сохранения ASIN ${asinCode}: ${e.message}`);
      }
    }

    return { sellerId, totalFound: data.totalResults || 0, queued: queuedCount, keepaExportId: keepaExport.id };
  }
}

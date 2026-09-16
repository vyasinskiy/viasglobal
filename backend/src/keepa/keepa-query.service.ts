import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  KeepaQueueService,
  KEEPA_PRIORITY,
  CategoryFinderPayload,
  BrandFinderPayload,
  SellerFinderPayload,
  ProductFinderOptions,
  KeepaRequestQueueJob,
} from './keepa-queue.service';
import { KeepaRequestType } from '@prisma/client';

@Injectable()
export class KeepaQueryService {
  private readonly logger = new Logger(KeepaQueryService.name);
  private readonly defaultDomainId = 4; // amazon.es

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => KeepaQueueService))
    private readonly queueService: KeepaQueueService,
  ) {}

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
   * Запуск Product Finder для категории через очередь
   */
  async fetchAndSaveKeepaExportForCategory(
    categoryId: string,
    options?: ProductFinderOptions,
    priority: number = KEEPA_PRIORITY.NORMAL,
  ) {
    const allowedCat = await this.prisma.keepaAllowedCategory.findUnique({
      where: { categoryId },
    });
    if (!allowedCat) {
      throw new Error(`Категория с ID ${categoryId} не найдена в списке разрешенных категорий`);
    }

    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.CATEGORY_FINDER,
      { categoryId, options },
      priority,
      10,
    );

    return { jobId: job.id, message: `Задача поиска по категории "${allowedCat.name}" добавлена в очередь` };
  }

  /**
   * Запуск Product Finder для всех активных категорий
   */
  async fetchAndSaveKeepaExportForAllCategories(
    options?: ProductFinderOptions,
    priority: number = KEEPA_PRIORITY.NORMAL,
  ) {
    const activeCategories = await this.prisma.keepaAllowedCategory.findMany({
      where: { isActive: true },
    });

    const results = [];
    for (const cat of activeCategories) {
      const res = await this.fetchAndSaveKeepaExportForCategory(
        cat.categoryId,
        {
          ...options,
          domainId: cat.domainId ?? options?.domainId,
        },
        priority,
      );
      results.push(res);
    }

    return results;
  }

  /**
   * Запуск Product Finder для каталога бренда
   */
  async fetchAndSaveKeepaExportForBrand(
    brandId: number,
    brandName: string,
    options?: ProductFinderOptions,
    priority: number = KEEPA_PRIORITY.NORMAL,
  ) {
    this.logger.log(`Инициация выгрузки бренда "${brandName}" (ID: ${brandId}) (priority: ${priority})...`);

    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.BRAND_FINDER,
      { brandId, brandName, options },
      priority,
      10,
    );

    return { jobId: job.id, message: `Задача выгрузки бренда ${brandName} добавлена в очередь` };
  }

  /**
   * Запуск Product Finder для витрины продавца
   */
  async fetchAndSaveKeepaExportForSeller(
    sellerId: string,
    options?: ProductFinderOptions,
    priority: number = KEEPA_PRIORITY.NORMAL,
  ) {
    this.logger.log(`Инициация выгрузки витрины продавца "${sellerId}" (priority: ${priority})...`);

    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.SELLER_FINDER,
      { sellerId, options },
      priority,
      10,
    );

    return { jobId: job.id, message: `Задача выгрузки продавца ${sellerId} добавлена в очередь` };
  }

  /**
   * Обработчик поиска по категории (CATEGORY_FINDER) через эндпоинт /query
   */
  public async handleCategoryFinderJob(job: KeepaRequestQueueJob): Promise<{ categoryId: string; categoryName?: string; totalFound: number; queued: number }> {
    const { categoryId, options } = job.payload as unknown as CategoryFinderPayload;
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) throw new Error('Не удалось сформировать URL к Keepa API');

    const allowedCat = await this.prisma.keepaAllowedCategory.findUnique({
      where: { categoryId },
    });
    const categoryName = allowedCat?.name;
    const categoryLabel = categoryName ? `"${categoryName}" (ID: ${categoryId})` : `ID: ${categoryId}`;

    const selection = {
      productType: [0],
      current_SALES_gte: options?.salesRankGte ?? 1,
      current_SALES_lte: options?.salesRankLte ?? 50000,
      current_BUY_BOX_SHIPPING_gte: options?.buyBoxGte ?? 1500,
      current_BUY_BOX_SHIPPING_lte: options?.buyBoxLte ?? 10000,
      current_COUNT_NEW_gte: options?.countNewGte ?? 5,
      current_COUNT_NEW_lte: options?.countNewLte ?? 15,
      rootCategory: [parseInt(categoryId, 10)],
      isAdultProduct: false,
      sort: [
        ['current_SALES', 'asc'],
        ['monthlySold', 'desc'],
      ],
      perPage: options?.perPage ?? 5000,
      page: options?.page ?? 0,
    };

    this.logger.log(`Выполняем запрос к Keepa Product Finder для категории ${categoryLabel}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection }),
    });

    const data = await response.json();
    this.queueService.updateTokensInfo(data.tokensLeft, data.refillRate);

    if (data.error) {
      throw new Error(`Ошибка Keepa API: ${JSON.stringify(data.error)}`);
    }

    const asins: string[] = data.asinList || [];
    let queued = 0;
    for (const asin of asins) {
      try {
        await this.prisma.requestProductQueue.upsert({
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

    this.logger.log(
      `Категория ${categoryLabel}: получено ASIN: ${asins.length}, добавлено в очередь анализа: ${queued} (всего в Keepa: ${data.totalResults || 0})`,
    );

    return { categoryId, categoryName, totalFound: data.totalResults || 0, queued };
  }

  /**
   * Обработчик поиска по бренду (BRAND_FINDER) через эндпоинт /query
   */
  public async handleBrandFinderJob(job: KeepaRequestQueueJob): Promise<{ brandId: number; totalFound: number; queued: number; keepaExportId: number }> {
    const { brandId, brandName, options } = job.payload as unknown as BrandFinderPayload;
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) throw new Error('Не удалось сформировать URL к Keepa API');

    const selection = {
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

    this.logger.log(`Выполняем запрос к Keepa Product Finder для бренда "${brandName}" (ID: ${brandId})...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection }),
    });

    const data = await response.json();
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

        await this.prisma.requestProductQueue.upsert({
          where: { asin: asinCode },
          update: {},
          create: { asin: asinCode, priority: 15, addedAt: new Date() },
        });
        queuedCount++;
      } catch (e: any) {
        this.logger.debug(`Ошибка сохранения ASIN ${asinCode}: ${e.message}`);
      }
    }

    this.logger.log(
      `Бренд "${brandName}": получено ASIN: ${asins.length}, добавлено в очередь анализа: ${queuedCount} (всего в Keepa: ${data.totalResults || 0})`,
    );

    return { brandId, totalFound: data.totalResults || 0, queued: queuedCount, keepaExportId: keepaExport.id };
  }

  /**
   * Обработчик поиска по витрине продавца (SELLER_FINDER) через эндпоинт /query
   */
  public async handleSellerFinderJob(job: KeepaRequestQueueJob): Promise<{ sellerId: string; totalFound: number; queued: number; keepaExportId: number }> {
    const { sellerId, options } = job.payload as unknown as SellerFinderPayload;
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) throw new Error('Не удалось сформировать URL к Keepa API');

    const selection = {
      productType: [0],
      buyBoxSellerId: [sellerId],
      current_BUY_BOX_SHIPPING_gte: 0,
      sort: [['current_SALES', 'asc'], ['monthlySold', 'desc']],
      perPage: options?.perPage ?? 5000,
      page: options?.page ?? 0,
    };

    this.logger.log(`Выполняем запрос к Keepa Product Finder для витрины продавца "${sellerId}"...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selection }),
    });

    const data = await response.json();
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

        await this.prisma.requestProductQueue.upsert({
          where: { asin: asinCode },
          update: {},
          create: { asin: asinCode, priority: 15, addedAt: new Date() },
        });
        queuedCount++;
      } catch (e: any) {
        this.logger.debug(`Ошибка сохранения ASIN ${asinCode}: ${e.message}`);
      }
    }

    this.logger.log(
      `Продавец "${sellerId}": получено ASIN: ${asins.length}, добавлено в очередь анализа: ${queuedCount} (всего в Keepa: ${data.totalResults || 0})`,
    );

    return { sellerId, totalFound: data.totalResults || 0, queued: queuedCount, keepaExportId: keepaExport.id };
  }
}

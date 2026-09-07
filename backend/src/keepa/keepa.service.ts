import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

@Injectable()
export class KeepaService {
  private readonly logger = new Logger(KeepaService.name);
  
  // Идентификатор маркетплейса Keepa (4 = amazon.es)
  private readonly defaultDomainId = 4;

  // Очередь и токены Keepa
  private tokensLeft: number = 10; // Начальное значение, обновится после первого запроса
  private refillRate: number = 1;  // Скорость обновления токенов в минуту
  private requestQueue: QueuedRequest[] = [];
  private isProcessingQueue: boolean = false;

  /**
   * Формирует базовый URL для запросов к Keepa API
   */
  private buildKeepaApiUrl(endpoint: string, domainId?: number): string | null {
    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) return null;
    
    const domain = domainId || this.defaultDomainId;
    return `https://api.keepa.com/${endpoint}?key=${apiKey}&domain=${domain}`;
  }

  /**
   * Единый метод для выполнения запросов к Keepa с учетом Rate Limit (токенов).
   */
  private executeKeepaRequest(url: string, options?: RequestInit, expectedCost: number = 1): Promise<any> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, expectedCost, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Процессор очереди запросов, следящий за токенами.
   */
  private async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const nextRequest = this.requestQueue[0]; // Смотрим на первый элемент
        
        if (this.tokensLeft < nextRequest.expectedCost) {
          // Вычисляем время ожидания: (недостающие токены) * (мс на один токен)
          // 60000 мс = 1 минута. Время на 1 токен = 60000 / refillRate.
          const msPerToken = 60000 / Math.max(1, this.refillRate);
          const delayMs = Math.ceil((nextRequest.expectedCost - this.tokensLeft) * msPerToken);
          
          this.logger.warn(`Недостаточно токенов Keepa. Ожидание ${delayMs} мс. (tokensLeft: ${this.tokensLeft}, need: ${nextRequest.expectedCost})`);
          
          // Ждем необходимое время
          await new Promise(res => setTimeout(res, delayMs));
          
          // После ожидания оптимистично добавляем накопленные токены
          // Точное значение будет получено из следующего ответа
          this.tokensLeft = Math.max(this.tokensLeft, nextRequest.expectedCost);
        }

        const request = this.requestQueue.shift();
        if (!request) break;

        try {
          const response = await fetch(request.url, request.options);
          const data = await response.json();
          
          // Обновляем состояние токенов из ответа API
          if (data.tokensLeft !== undefined) {
            this.tokensLeft = data.tokensLeft;
          }
          if (data.refillRate !== undefined) {
            this.refillRate = data.refillRate;
          }
          
          request.resolve(data);
        } catch (error) {
          this.logger.error(`Ошибка при выполнении запроса из очереди: ${error.message}`);
          request.reject(error);
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
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
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async fetchRawData() {
    const baseUrl = this.buildKeepaApiUrl('product');
    if (!baseUrl) {
      this.logger.warn('KEEPA_API_KEY не установлен. Пропуск запроса.');
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

    const asinsToFetch = result.map(r => r.asin).join(',');
    this.logger.log(`Запрашиваем Keepa API для ASIN: ${asinsToFetch}...`);

    try {
      let url = `${baseUrl}&asin=${asinsToFetch}`;
      
      if (process.env.KEEPA_FETCH_OFFERS === 'true') {
        url += '&offers=20';
      }
      
      const cost = (process.env.KEEPA_FETCH_OFFERS === 'true') ? 3 : 1;
      const data = await this.executeKeepaRequest(url, undefined, cost);

      if (data.error) {
        this.logger.error(`Ошибка API Keepa: ${JSON.stringify(data.error)}`);
        // Сохраняем ошибку для всех запрошенных ASIN
        for (const row of result) {
          await this.prisma.keepaApiRawResponse.upsert({
            where: { asin: row.asin },
            update: { error: JSON.stringify(data.error), isProcessed: false, fetchedAt: new Date() },
            create: { asin: row.asin, error: JSON.stringify(data.error), fetchedAt: new Date() }
          });
        }
        return;
      }

      // Теперь у нас есть умная очередь, мы не прерываемся так часто. 
      // Но если токены жестко закончились по вине сторонних процессов, очередь их подождет.
      if (data.tokensLeft === 0 || (data.tokensLeft !== undefined && data.tokensLeft < 3 && data.tokensConsumed === 0 && !data.products)) {
        this.logger.warn(`Лимит токенов Keepa исчерпан жестко (осталось: ${data.tokensLeft}). Очередь должна выровнять баланс.`);
      }


      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14); // Кэшируем на 14 дней

      // Успешно получили данные
      // Keepa возвращает массив продуктов в data.products. Для каждого ASIN находим свой продукт и сохраняем
      for (const row of result) {
        const asinToFetch = row.asin;
        const product = data.products?.find((p: any) => p.asin === asinToFetch);
        
        if (!product) {
          // Keepa не вернула данные для этого ASIN (возможно неверный ASIN)
          await this.prisma.keepaApiRawResponse.upsert({
            where: { asin: asinToFetch },
            update: { error: 'Not found in Keepa response', isProcessed: false, fetchedAt: new Date(), expiresAt },
            create: { asin: asinToFetch, error: 'Not found in Keepa response', fetchedAt: new Date(), expiresAt, isProcessed: false }
          });
          continue;
        }

        // Сохраняем успешный ответ, упаковывая отдельный продукт в структуру data
        const payload = { ...data, products: [product] };
        await this.prisma.keepaApiRawResponse.upsert({
          where: { asin: asinToFetch },
          update: { 
            rawPayload: payload as any,
            fetchedAt: new Date(),
            expiresAt: expiresAt,
            isProcessed: false,
            error: null
          },
          create: {
            asin: asinToFetch,
            rawPayload: payload as any,
            fetchedAt: new Date(),
            expiresAt: expiresAt,
            isProcessed: false
          }
        });
      }

      this.logger.log(`Успешно сохранены сырые ответы Keepa для ${result.length} ASIN.`);
    } catch (error) {
      this.logger.error(`Сетевая ошибка при запросе к Keepa: ${error.message}`);
    }
  }

  /**
   * Обработчик сырых данных (раз в минуту)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processRawData() {
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

      // Извлекаем габариты упаковки
      const pLength = product.packageLength || null;
      const pWidth = product.packageWidth || null;
      const pHeight = product.packageHeight || null;
      const pWeight = product.packageWeight || null;

      // Извлекаем габариты самого товара
      const iLength = product.itemLength || null;
      const iWidth = product.itemWidth || null;
      const iHeight = product.itemHeight || null;
      const iWeight = product.itemWeight || null;

      // Вычисляем Amazon Size Tier
      const sizeTier = this.calculateAmazonTier(pLength, pWidth, pHeight, pWeight);

      // Извлекаем финансы и прочее
      const fbaFees = product.fbaFees || {};
      const pickAndPackFee = fbaFees.pickAndPackFee || null;
      
      let currentSalesRank = null;
      let avg90SalesRank = null;
      if (product.stats) {
        currentSalesRank = product.stats.current?.[3] || null; // В Keepa stats 3 индекс обычно отвечает за Sales Rank (зависит от настроек)
        avg90SalesRank = product.stats.avg90?.[3] || null;
      }

      // Сохраняем в чистовик
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
        lastProcessedAt: new Date()
      };

      await this.prisma.keepaApiProcessedData.upsert({
        where: { asin: raw.asin },
        update: processedData,
        create: {
          asin: raw.asin,
          ...processedData
        }
      });

      // Помечаем сырые данные как обработанные
      await this.prisma.keepaApiRawResponse.update({
        where: { asin: raw.asin },
        data: { isProcessed: true }
      });

      // Добавляем ASIN в очередь на анализ тегов (Dead/Missing Variation) с обычным приоритетом
      await this.analysisService.queueForAnalysis(raw.asin, 0);

      this.logger.log(`ASIN ${raw.asin} успешно обработан и извлечены габариты.`);
    }
  }

  /**
   * Функция определения FBA Size Tier по габаритам (мм) и весу (г)
   * Примерная логика по сетке Amazon Europe
   */
  private calculateAmazonTier(lengthMm: number | null, widthMm: number | null, heightMm: number | null, weightG: number | null): string | null {
    if (!lengthMm || !widthMm || !heightMm || !weightG) return null;

    // Сортируем стороны по убыванию (длинная, средняя, короткая)
    const sides = [lengthMm / 10, widthMm / 10, heightMm / 10].sort((a, b) => b - a);
    const [lCm, wCm, hCm] = sides;
    const kg = weightG / 1000;

    // Small Envelope (20 x 15 x 1 см, до 80г)
    if (lCm <= 20 && wCm <= 15 && hCm <= 1 && kg <= 0.08) return 'Small envelope';
    // Standard Envelope (33 x 23 x 2.5 см, до 460г)
    if (lCm <= 33 && wCm <= 23 && hCm <= 2.5 && kg <= 0.46) return 'Standard envelope';
    // Large Envelope (33 x 23 x 5 см, до 960г)
    if (lCm <= 33 && wCm <= 23 && hCm <= 5 && kg <= 0.96) return 'Large envelope';
    // Standard Parcel (45 x 34 x 26 см, до 11.9 кг)
    if (lCm <= 45 && wCm <= 34 && hCm <= 26 && kg <= 11.9) return 'Standard parcel';
    // Small Oversize (61 x 46 x 46 см, до 1.76 кг)
    if (lCm <= 61 && wCm <= 46 && hCm <= 46 && kg <= 1.76) return 'Small Oversize';
    // Standard Oversize (120 x 60 x 60 см, до 29.76 кг)
    if (lCm <= 120 && wCm <= 60 && hCm <= 60 && kg <= 29.76) return 'Standard Oversize';
    // Large Oversize (>120 или >60 или >60, до 31.5 кг)
    if (kg <= 31.5) return 'Large Oversize';
    
    return 'Special Oversize'; // Всё что больше
  }

  /**
   * Запрос к Keepa Product Finder API с динамической категорией и безопасными фильтрами
   * @param categoryId Идентификатор корневой категории Keepa (Browse Node ID)
   * @param options Дополнительные параметры фильтрации
   */
  async fetchProductFinder(categoryId: string, options?: ProductFinderOptions) {
    const url = this.buildKeepaApiUrl('query', options?.domainId);
    if (!url) {
      this.logger.warn('KEEPA_API_KEY не установлен. Пропуск запроса Product Finder.');
      return { asins: [], totalResults: 0, queued: 0 };
    }

    // Формируем полезную нагрузку запроса согласно утвержденному безопасному стандарту
    const payload = {
      // 0 = Физические товары Amazon (отсекает цифровые товары, подписки и книги)
      productType: [0],
      // Нижняя граница BSR: от 1 для захвата высоколиквидных товаров с быстрой оборачиваемостью
      current_SALES_gte: options?.salesRankGte ?? 1,
      // Верхняя граница BSR: до 50 000 для исключения мертвого груза и неликвида
      current_SALES_lte: options?.salesRankLte ?? 50000,
      // Нижняя граница цены Buy Box: 15.00 € (в евроцентах) для обеспечения окупаемости комиссий FBA
      current_BUY_BOX_SHIPPING_gte: options?.buyBoxGte ?? 1500,
      // Верхняя граница цены Buy Box: 100.00 € (в евроцентах) для защиты оборотного капитала от дорогих возвратов
      current_BUY_BOX_SHIPPING_lte: options?.buyBoxLte ?? 10000,
      // От 5 продавцов: гарантия того, что бренд открыт для реселлеров (не Private Label и нет риска жалоб на IP)
      current_COUNT_NEW_gte: options?.countNewGte ?? 5,
      // До 15 продавцов: защита от жесткого демпинга цен автоматическими репрайсерами
      current_COUNT_NEW_lte: options?.countNewLte ?? 15,
      // Динамический идентификатор категории из утвержденного списка разрешенных категорий
      rootCategory: [categoryId],
      // Строгое исключение товаров для взрослых (защита личного имущества автонома по ст. 1911 ГК Испании)
      isAdultProduct: false,
      // Двухуровневая сортировка: сначала лучшие продажи по BSR, затем объем продаж в месяц
      sort: [
        ['current_SALES', 'asc'],
        ['monthlySold', 'desc']
      ],
      // Размер страницы выдачи (100 позиций за раз для оптимального расхода токенов)
      perPage: options?.perPage ?? 100,
      // Номер запрашиваемой страницы
      page: options?.page ?? 0
    };

    this.logger.log(`Отправляем запрос к Keepa Product Finder для категории ${categoryId}...`);

    try {
      // Отправка POST-запроса к API Keepa через очередь
      // Для Product Finder запрос обычно стоит 1 токен, но может варьироваться. Берем 1 по умолчанию.
      const data = await this.executeKeepaRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, 1);

      // Проверка на наличие ошибки от API Keepa
      if (data.error) {
        this.logger.error(`Ошибка Keepa Product Finder API: ${JSON.stringify(data.error)}`);
        return { asins: [], totalResults: 0, queued: 0, error: data.error };
      }

      const asinList: string[] = data.asinList || [];
      const totalResults: number = data.totalResults || 0;
      this.logger.log(`Keepa Product Finder вернул ${asinList.length} ASIN (всего найдено: ${totalResults}) для категории ${categoryId}`);

      if (asinList.length === 0) {
        return { asins: [], totalResults, queued: 0 };
      }

      // Добавление найденных ASIN в очередь WholesaleAsinQueue
      let queuedCount = 0;
      for (const asin of asinList) {
        try {
          await this.prisma.wholesaleAsinQueue.upsert({
            where: { asin },
            update: {}, // Если ASIN уже в очереди, сохраняем существующий приоритет
            create: {
              asin,
              priority: 10, // Базовый приоритет для новинок из Product Finder
              addedAt: new Date()
            }
          });
          queuedCount++;
        } catch (queueErr) {
          this.logger.debug(`Пропуск ASIN ${asin} при добавлении в очередь: ${queueErr.message}`);
        }
      }

      this.logger.log(`Успешно добавлено в очередь ${queuedCount} новых ASIN из категории ${categoryId}`);
      return { asins: asinList, totalResults, queued: queuedCount };
    } catch (error) {
      this.logger.error(`Сетевая ошибка при вызове Keepa Product Finder: ${error.message}`);
      throw error;
    }
  }

  /**
   * Запуск выгрузки по всем активным разрешенным категориям из базы данных
   */
  async fetchProductFinderForAllAllowedCategories(options?: Omit<ProductFinderOptions, 'domainId'>) {
    this.logger.log('Получаем список активных разрешенных категорий из базы данных...');

    // Выбираем только активные категории из таблицы KeepaAllowedCategory
    const categories = await this.prisma.keepaAllowedCategory.findMany({
      where: { isActive: true }
    });

    if (categories.length === 0) {
      this.logger.warn('В базе данных нет активных категорий в таблице KeepaAllowedCategory.');
      return [];
    }

    this.logger.log(`Найдено активных категорий: ${categories.length}`);
    const results = [];

    // Последовательно опрашиваем каждую категорию с паузой для сохранения токенов
    for (const cat of categories) {
      this.logger.log(`Обработка категории: ${cat.name} (ID: ${cat.categoryId})...`);
      const res = await this.fetchProductFinder(cat.categoryId, {
        ...options,
        domainId: cat.domainId
      });

      results.push({
        categoryId: cat.categoryId,
        categoryName: cat.name,
        ...res
      });

      // Пауза 2 секунды между запросами категорий для плавного расхода лимита токенов Keepa
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }
}

/**
 * Опции для вызова Keepa Product Finder API
 */
export interface ProductFinderOptions {
  salesRankGte?: number;
  salesRankLte?: number;
  buyBoxGte?: number;
  buyBoxLte?: number;
  countNewGte?: number;
  countNewLte?: number;
  perPage?: number;
  page?: number;
  domainId?: number;
}

/**
 * Описание запроса в очереди.
 */
interface QueuedRequest {
  url: string;
  options?: RequestInit;
  expectedCost: number;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

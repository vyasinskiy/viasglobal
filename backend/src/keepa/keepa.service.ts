import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

@Injectable()
export class KeepaService {
  private readonly logger = new Logger(KeepaService.name);

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
    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) {
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
      const domain = 4; // Испания по умолчанию
      let url = `https://api.keepa.com/product?key=${apiKey}&domain=${domain}&asin=${asinsToFetch}`;
      
      if (process.env.KEEPA_FETCH_OFFERS === 'true') {
        url += '&offers=20';
      }
      
      const response = await fetch(url);
      const data = await response.json();

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

      // Вычисляем expiresAt (допустим, 30 дней)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

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
        variationCSV: product.variationCSV || null,
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
}

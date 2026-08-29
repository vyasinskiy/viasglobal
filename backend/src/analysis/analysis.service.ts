import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Добавляет ASIN в очередь на анализ
   */
  async queueForAnalysis(asin: string, priority: number = 0) {
    return this.prisma.asinAnalysisQueue.upsert({
      where: { asin },
      update: { priority, addedAt: new Date() },
      create: { asin, priority }
    });
  }

  /**
   * Конвертирует Keepa-минуты в JS Date
   * Keepa time - это количество минут с 2011-01-01
   */
  private keepaMinutesToDate(minutes: number): Date {
    const keepaEpoch = new Date('2011-01-01T00:00:00Z').getTime();
    return new Date(keepaEpoch + minutes * 60000);
  }

  /**
   * Воркер для анализа ASINов из очереди AsinAnalysisQueue
   * Запускается раз в минуту
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async analyzeAsins() {
    // Берем пачку ASIN-ов из очереди (100 за раз), сортируем по приоритету, затем по дате
    const queueItems = await this.prisma.asinAnalysisQueue.findMany({
      take: 100,
      orderBy: [
        { priority: 'desc' },
        { addedAt: 'asc' }
      ],
    });

    if (queueItems.length === 0) return;

    this.logger.log(`Начинаем анализ ${queueItems.length} ASIN-ов на предмет тегов...`);

    for (const item of queueItems) {
      const asin = item.asin;

      // Достаем обработанные данные Keepa
      const keepaData = await this.prisma.keepaApiProcessedData.findUnique({
        where: { asin },
      });

      if (!keepaData) {
        // Данных нет, логируем ошибку (этого не должно быть, так как в очередь попадают после сохранения)
        this.logger.error(`Данные Keepa не найдены для ASIN ${asin} при анализе тегов!`);
        await this.prisma.asinAnalysisQueue.delete({ where: { asin } });
        continue;
      }

      await this.analyzeVariationTags(asin, keepaData);

      // Удаляем из очереди после обработки всех анализаторов
      await this.prisma.asinAnalysisQueue.delete({ where: { asin } });
    }

    this.logger.log(`Анализ пачки завершен.`);
  }

  /**
   * Анализирует ASIN на наличие вариаций и присваивает теги (DEAD_VARIATION, MISSING_VARIATION)
   */
  private async analyzeVariationTags(asin: string, keepaData: any) {
    // Проверяем наличие вариаций (если variationCSV не пустой)
    const hasVariations = keepaData.variationCSV && keepaData.variationCSV.trim().length > 0;

    if (!hasVariations) {
      return;
    }

    // Анализируем buyBoxSellerIdHistory
    // Формат Keepa: [time, sellerId, time, sellerId, ...]
    let lastBuyBoxDate: Date | null = null;
    const history = keepaData.buyBoxSellerIdHistory as any;

    if (Array.isArray(history) && history.length > 0) {
      // Идем с конца массива, чтобы найти самую свежую запись с валидным продавцом
      for (let i = history.length - 2; i >= 0; i -= 2) {
        const time = history[i];
        const sellerId = history[i + 1];

        // В Keepa -1 означает потерю Buy Box (Out of Stock или Suppressed)
        if (sellerId !== '-1' && sellerId !== -1) {
          lastBuyBoxDate = this.keepaMinutesToDate(time);
          break;
        }
      }
    }

    let tagToAdd: string | null = null;
    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;

    if (!lastBuyBoxDate) {
      // Если вообще никогда не было Buy Box (история пуста или одни -1)
      tagToAdd = 'DEAD_VARIATION';
    } else {
      const daysSinceLastBuyBox = (now.getTime() - lastBuyBoxDate.getTime()) / msPerDay;

      if (daysSinceLastBuyBox > 180) {
        tagToAdd = 'DEAD_VARIATION';
      } else if (daysSinceLastBuyBox > 90) {
        tagToAdd = 'MISSING_VARIATION';
      }
    }

    if (tagToAdd) {
      // Добавляем тег, если его еще нет
      const asinRecord = await this.prisma.aSIN.findUnique({
        where: { code: asin },
        select: { tags: true },
      });

      // Если ASIN найден, мы можем просто использовать connectOrCreate для связи тега.
      if (asinRecord) {
        await this.prisma.aSIN.update({
          where: { code: asin },
          data: {
            tags: {
              connectOrCreate: {
                where: { name: tagToAdd },
                create: { name: tagToAdd },
              },
            },
          },
        });
        this.logger.log(`Присвоен тег ${tagToAdd} для ASIN ${asin}`);
      }
    }
  }
}

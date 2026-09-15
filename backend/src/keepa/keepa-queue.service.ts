import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KeepaRequestQueue, KeepaRequestStatus, KeepaRequestType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { KeepaService } from './keepa.service';

/**
 * Константы приоритетов запросов к Keepa API
 */
export const KEEPA_PRIORITY = {
  CRITICAL: 100, // Экстренные ручные запросы (ручной запрос ASIN пользователем)
  HIGH: 50,      // Запросы каталогов бренда или витрины продавца
  NORMAL: 10,    // Регулярный фоновый сбор сырых данных по товарам
  LOW: 1         // Тяжелый массовый поиск по категориям Product Finder
} as const;

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
 * Полезная нагрузка для запроса карточек товаров
 */
export interface ProductAsinsPayload {
  asins: string[];
  offers?: boolean;
  domainId?: number;
}

/**
 * Полезная нагрузка для поиска по категории
 */
export interface CategoryFinderPayload {
  categoryId: string;
  options?: ProductFinderOptions;
}

/**
 * Полезная нагрузка для поиска по бренду
 */
export interface BrandFinderPayload {
  brandId: number;
  brandName: string;
  options?: ProductFinderOptions;
}

/**
 * Полезная нагрузка для поиска по продавцу
 */
export interface SellerFinderPayload {
  sellerId: string;
  options?: ProductFinderOptions;
}

/**
 * Полный типизированный интерфейс сущности задачи KeepaRequestQueue
 */
export type KeepaRequestQueueJob = KeepaRequestQueue;

@Injectable()
export class KeepaQueueService {
  private readonly logger = new Logger(KeepaQueueService.name);

  // Резерв токенов Keepa для экстренных задач (минимум 10 токенов)
  private readonly tokenReserveThreshold = 10;

  // Локальное кэшированное состояние токенов
  private tokensLeft: number = 10;
  private refillRate: number = 1;
  private isProcessing: boolean = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
    @Inject(forwardRef(() => KeepaService))
    private readonly keepaService: KeepaService,
  ) {}

  /**
   * Получение текущего баланса токенов
   */
  public getTokensLeft(): number {
    return this.tokensLeft;
  }

  /**
   * Принудительное обновление состояния токенов из API
   */
  public async refreshTokensStatus(): Promise<{ tokensLeft: number; refillRate: number }> {
    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) return { tokensLeft: this.tokensLeft, refillRate: this.refillRate };

    try {
      const response = await fetch(`https://api.keepa.com/token?key=${apiKey}`);
      const data = await response.json();
      if (data.tokensLeft !== undefined) this.tokensLeft = data.tokensLeft;
      if (data.refillRate !== undefined) this.refillRate = data.refillRate;
    } catch (e: any) {
      this.logger.warn(`Не удалось обновить статус токенов Keepa: ${e.message}`);
    }

    return { tokensLeft: this.tokensLeft, refillRate: this.refillRate };
  }

  /**
   * Добавление нового запроса в персистентную очередь БД
   * @param type Тип запроса к Keepa
   * @param payload Данные запроса
   * @param priority Приоритет выполнения
   * @param expectedCost Ожидаемая стоимость в токенах
   */
  async enqueueRequest(
    type: KeepaRequestType,
    payload: any,
    priority: number = KEEPA_PRIORITY.NORMAL,
    expectedCost: number = 1,
  ) {
    this.logger.log(`Добавление задачи в очередь Keepa: type=${type}, priority=${priority}, cost=${expectedCost}`);

    const job = await this.prisma.keepaRequestQueue.create({
      data: {
        type,
        payload,
        priority,
        expectedCost,
        status: KeepaRequestStatus.PENDING,
      },
    });

    // Запускаем обработку в фоне без блокировки
    this.processNextJobs().catch((err) => {
      this.logger.error(`Ошибка при фоновой обработке очереди Keepa: ${err.message}`);
    });

    return job;
  }

  /**
   * Запуск обработки следующей подходящей задачи из очереди
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processNextJobs() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    try {
      let continueLoop = true;

      while (continueLoop) {
        // 1. Проверяем, есть ли задачи со статусом PENDING
        // Выбираем задачу с максимальным приоритетом и старейшую по createdAt
        const candidate = await this.prisma.keepaRequestQueue.findFirst({
          where: { status: KeepaRequestStatus.PENDING },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        });

        if (!candidate) {
          // Задач нет, выходим
          continueLoop = false;
          break;
        }

        // 2. Проверка токенов и резерва в 10 токенов
        // Если приоритет меньше CRITICAL (100), то токенов должно быть строго больше, чем резерв + стоимость
        const isCritical = candidate.priority >= KEEPA_PRIORITY.CRITICAL;
        const minTokensRequired = isCritical ? candidate.expectedCost : (this.tokenReserveThreshold + candidate.expectedCost);

        if (this.tokensLeft < minTokensRequired) {
          // Пытаемся освежить статус токенов из API
          await this.refreshTokensStatus();

          if (this.tokensLeft < minTokensRequired) {
            this.logger.debug(
              `Недостаточно токенов для задачи #${candidate.id} (type: ${candidate.type}, priority: ${candidate.priority}). ` +
              `Текущие токены: ${this.tokensLeft}, требуется минимум: ${minTokensRequired} (резерв: ${isCritical ? 0 : this.tokenReserveThreshold}). Ожидание накопления.`,
            );
            continueLoop = false;
            break;
          }
        }

        // 3. Захват задачи в статус PROCESSING
        const job = await this.prisma.keepaRequestQueue.update({
          where: { id: candidate.id, status: KeepaRequestStatus.PENDING },
          data: {
            status: KeepaRequestStatus.PROCESSING,
            startedAt: new Date(),
            attempts: { increment: 1 },
          },
        }).catch(() => null);

        if (!job) {
          // Задачу перехватил другой процесс
          continue;
        }

        // 4. Выполнение задачи через основной сервис KeepaService
        try {
          const result = await this.keepaService.executeJob(job);
          await this.prisma.keepaRequestQueue.update({
            where: { id: job.id },
            data: {
              status: KeepaRequestStatus.COMPLETED,
              completedAt: new Date(),
              resultSummary: result as any,
              error: null,
            },
          });
          this.logger.log(`Задача #${job.id} (${job.type}) успешно выполнена.`);
        } catch (error: any) {
          this.logger.error(`Ошибка при выполнении задачи #${job.id} (${job.type}): ${error.message}`);
          await this.prisma.keepaRequestQueue.update({
            where: { id: job.id },
            data: {
              status: job.attempts >= 3 ? KeepaRequestStatus.FAILED : KeepaRequestStatus.PENDING,
              error: error.message,
            },
          });
          continueLoop = false;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Обновление закэшированной информации о токенах Keepa
   */
  public updateTokensInfo(tokensLeft?: number, refillRate?: number): void {
    if (tokensLeft !== undefined) this.tokensLeft = tokensLeft;
    if (refillRate !== undefined) this.refillRate = refillRate;
  }
}

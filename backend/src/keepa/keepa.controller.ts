import { Controller, Post, Get, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { KeepaService } from './keepa.service';
import { KeepaQueueService, KEEPA_PRIORITY } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { KeepaRequestType } from '@prisma/client';

@Controller('keepa')
export class KeepaController {
  constructor(
    private readonly keepaService: KeepaService,
    private readonly queueService: KeepaQueueService,
    private readonly prisma: PrismaService
  ) {}

  @Post('populate-queue')
  async triggerPopulateQueue() {
    await this.keepaService.populateQueue();
    return { message: 'Queue populated successfully from WholesaleCandidatesView' };
  }

  @Post('enqueue/:asin')
  async enqueueAndFetch(@Param('asin') asin: string) {
    if (!asin) {
      throw new HttpException('ASIN is required', HttpStatus.BAD_REQUEST);
    }

    // 1. Создаем экстренную задачу с наивысшим приоритетом CRITICAL (100)
    // Она может расходовать токены из резерва (вплоть до 1 токена)
    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.PRODUCT_ASINS,
      { asins: [asin], offers: true },
      KEEPA_PRIORITY.CRITICAL,
      1,
    );

    // 2. Немедленно выполняем задачу в приоритетном режиме через основной сервис KeepaService
    try {
      await this.keepaService.executeJob(job);
      await this.prisma.keepaRequestQueue.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    } catch (err: any) {
      await this.prisma.keepaRequestQueue.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: err.message },
      });
      throw new HttpException(`Ошибка выполнения экстренного запроса Keepa: ${err.message}`, HttpStatus.BAD_GATEWAY);
    }

    // 3. Возвращаем результат из чистовика
    const processed = await this.prisma.keepaApiProcessedData.findUnique({
      where: { asin },
    });

    if (!processed) {
      throw new HttpException('Данные не были обработаны или ASIN не найден в Keepa', HttpStatus.NOT_FOUND);
    }

    return processed;
  }

  /**
   * Получение списка разрешенных безопасных категорий из БД
   */
  @Get('allowed-categories')
  async getAllowedCategories() {
    // Возвращаем все записи из таблицы разрешенных категорий
    return this.prisma.keepaAllowedCategory.findMany({
      orderBy: { id: 'asc' }
    });
  }

  /**
   * Запуск Product Finder для конкретной категории
   */
  @Post('export/category/:categoryId')
  async exportCategory(@Param('categoryId') categoryId: string) {
    if (!categoryId) {
      throw new HttpException('Идентификатор категории обязателен', HttpStatus.BAD_REQUEST);
    }

    // Запускаем поиск по категории с безопасными фильтрами и наивысшим приоритетом CRITICAL (ручной запрос)
    return this.keepaService.fetchAndSaveKeepaExportForCategory(
      categoryId,
      undefined,
      KEEPA_PRIORITY.CRITICAL,
    );
  }

  /**
   * Запуск Product Finder для всех активных категорий из белого списка БД
   */
  @Post('export/category-all')
  async exportAllCategories() {
    // Опрашиваем все активные категории с приоритетом CRITICAL (ручной запрос)
    return this.keepaService.fetchAndSaveKeepaExportForAllCategories(
      undefined,
      KEEPA_PRIORITY.CRITICAL,
    );
  }

  /**
   * Запуск экспорта каталога бренда через Keepa Product Finder
   */
  @Post('export/brand/:brandId')
  async exportBrand(@Param('brandId') brandId: string, @Query('name') brandName: string) {
    if (!brandId || !brandName) {
      throw new HttpException('Brand ID and Name are required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.keepaService.fetchAndSaveKeepaExportForBrand(
      parseInt(brandId, 10),
      brandName,
      undefined,
      KEEPA_PRIORITY.CRITICAL,
    );
    if (!result) {
      throw new HttpException('Failed to generate export or no ASINs found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  /**
   * Запуск экспорта витрины продавца через Keepa Product Finder
   */
  @Post('export/seller/:sellerId')
  async exportSeller(@Param('sellerId') sellerId: string) {
    if (!sellerId) {
      throw new HttpException('Seller ID is required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.keepaService.fetchAndSaveKeepaExportForSeller(
      sellerId,
      undefined,
      KEEPA_PRIORITY.CRITICAL,
    );
    if (!result) {
      throw new HttpException('Failed to generate export or no ASINs found', HttpStatus.NOT_FOUND);
    }
    return result;
  }
}


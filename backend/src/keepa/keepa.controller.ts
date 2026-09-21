import { Controller, Post, Get, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { KeepaProductService } from './keepa-product.service';
import { KeepaQueryService } from './keepa-query.service';
import { KeepaQueueService, KEEPA_PRIORITY, ProductAsinsPayload } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { KeepaRequestType } from '@prisma/client';

@Controller('keepa')
export class KeepaController {
  constructor(
    private readonly productService: KeepaProductService,
    private readonly queryService: KeepaQueryService,
    private readonly queueService: KeepaQueueService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Заполнение оптовой очереди из CandidatesProductsView
   */
  @Post('populate-queue')
  async triggerPopulateQueue() {
    await this.productService.populateQueue();
    return { message: 'Queue populated successfully from CandidatesProductsView' };
  }

  /**
   * Экстренная постановка ASIN в очередь и немедленное получение чистовых данных
   */
  @Post('enqueue/:asin')
  async enqueueAndFetch(@Param('asin') asin: string) {
    if (!asin) {
      throw new HttpException('ASIN is required', HttpStatus.BAD_REQUEST);
    }

    const asinsPayload: ProductAsinsPayload = { asins: [asin], offers: true };

    // 1. Создаем экстренную задачу с наивысшим приоритетом CRITICAL (100)
    const job = await this.queueService.enqueueRequest(
      KeepaRequestType.PRODUCT_ASINS,
      asinsPayload,
      KEEPA_PRIORITY.CRITICAL,
      1,
    );

    // 2. Немедленно выполняем задачу через KeepaProductService
    try {
      await this.productService.handleProductAsinsJob(job);
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
    return this.prisma.keepaAllowedCategory.findMany({
      orderBy: { id: 'asc' },
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

    return this.queryService.fetchAndSaveKeepaExportForCategory(
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
    return this.queryService.fetchAndSaveKeepaExportForAllCategories(
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
    const result = await this.queryService.fetchAndSaveKeepaExportForBrand(
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
    const result = await this.queryService.fetchAndSaveKeepaExportForSeller(
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

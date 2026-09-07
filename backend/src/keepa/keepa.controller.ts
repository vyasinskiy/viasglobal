import { Controller, Post, Get, Param, HttpException, HttpStatus, Query } from '@nestjs/common';
import { KeepaService } from './keepa.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('keepa')
export class KeepaController {
  constructor(
    private readonly keepaService: KeepaService,
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

    // 1. Добавляем ASIN в очередь с максимальным приоритетом
    await this.prisma.wholesaleAsinQueue.upsert({
      where: { asin },
      update: { priority: 999999 },
      create: { asin, priority: 999999 }
    });

    // 2. Принудительно дергаем сборщик и обработчик
    await this.keepaService.fetchRawData();
    await this.keepaService.processRawData();

    // 3. Возвращаем результат
    const processed = await this.prisma.keepaApiProcessedData.findUnique({
      where: { asin }
    });

    if (!processed) {
      throw new HttpException('Данные не были обработаны или ASIN не найден', HttpStatus.NOT_FOUND);
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
  @Post('product-finder/category/:categoryId')
  async runProductFinderForCategory(@Param('categoryId') categoryId: string) {
    if (!categoryId) {
      throw new HttpException('Идентификатор категории обязателен', HttpStatus.BAD_REQUEST);
    }

    // Запускаем поиск по категории с безопасными фильтрами по умолчанию
    return this.keepaService.fetchProductFinder(categoryId);
  }

  /**
   * Запуск Product Finder для всех активных категорий из белого списка БД
   */
  @Post('product-finder/all')
  async runProductFinderForAll() {
    // Опрашиваем все активные категории
    return this.keepaService.fetchProductFinderForAllAllowedCategories();
  }
}

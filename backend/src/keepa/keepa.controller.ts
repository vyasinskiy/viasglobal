import { Controller, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
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
}

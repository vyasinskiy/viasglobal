import { Controller, Post, Get, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { DistributorsService } from './distributors.service';
import { DistributorStatus } from '@prisma/client';

@Controller('distributors')
export class DistributorsController {
  constructor(private readonly distributorsService: DistributorsService) {}

  /**
   * Создает или обновляет дистрибьютора
   */
  @Post()
  async create(@Body() body: any) {
    return this.distributorsService.create(body);
  }

  /**
   * Получает список дистрибьюторов с фильтрацией по статусу
   */
  @Get()
  async findAll(@Query('status') status?: DistributorStatus) {
    return this.distributorsService.findAll(status);
  }

  /**
   * Получает данные дистрибьютора по ID
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.distributorsService.findById(id);
  }

  /**
   * Обновляет статус воронки и комментарии дистрибьютора
   */
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      status: DistributorStatus;
      notes?: string;
      rejectionReason?: string;
      email?: string;
      phone?: string;
    }
  ) {
    return this.distributorsService.updateStatus(id, body);
  }
}

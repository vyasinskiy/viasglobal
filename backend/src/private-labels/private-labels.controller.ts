import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { PrivateLabelsService } from './private-labels.service';

@Controller('private-labels')
export class PrivateLabelsController {
  constructor(private readonly privateLabelsService: PrivateLabelsService) {}

  /**
   * Проверяет статус приватного лейбла для связки Бренд + Продавец
   */
  @Get('check')
  async check(
    @Query('brandName') brandName: string,
    @Query('sellerId') sellerId: string,
  ) {
    if (!brandName || !sellerId) {
      return { isPrivateLabel: false };
    }
    const status = await this.privateLabelsService.checkPrivateLabel(brandName, sellerId);
    return { brandName, sellerId, ...status };
  }

  /**
   * Добавляет связку Бренд + Продавец (Private Label)
   */
  @Post()
  async add(
    @Body('brandName') brandName: string,
    @Body('sellerId') sellerId: string,
    @Body('sellerName') sellerName?: string,
  ) {
    if (!brandName || !sellerId) {
      return { error: 'brandName and sellerId are required' };
    }
    return this.privateLabelsService.addPrivateLabel(brandName, sellerId, sellerName);
  }
}


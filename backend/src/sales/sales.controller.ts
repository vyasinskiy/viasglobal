import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

/**
 * REST API контроллер продаж маркетплейсов и аналитики партий
 */
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Список всех заказов продаж
   * GET /sales?platform=AMAZON
   */
  @Get()
  async getSales(@Query('platform') platform?: string) {
    const orders = await this.salesService.getSalesOrders(platform);
    return { status: 'success', total: orders.length, orders };
  }

  /**
   * Зафиксировать продажу (Amazon FBM/FBA) со списанием с СВХ
   * POST /sales
   */
  @Post()
  async recordSale(@Body() body: any) {
    const result = await this.salesService.recordSale(body);
    return {
      status: 'success',
      message: 'Продажа успешно зафиксирована, остатки списаны',
      order: result.order,
      stockAlerts: result.stockAlerts,
    };
  }

  /**
   * Сквозная прослеживаемость партии: куда и кому была продана партия поставщика
   * GET /sales/trace-batch/:orderIdOrNumber
   */
  @Get('trace-batch/:orderIdOrNumber')
  async traceBatch(@Param('orderIdOrNumber') orderIdOrNumber: string) {
    const trace = await this.salesService.getBatchSalesTrace(orderIdOrNumber);
    return { status: 'success', trace };
  }
}

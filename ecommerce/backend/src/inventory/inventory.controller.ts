import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { WarehouseLocation } from '@prisma/client';

/**
 * REST API контроллер управления складскими остатками и перемещениями
 */
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Получить текущие остатки
   * GET /inventory/stocks?warehouse=SVH
   */
  @Get('stocks')
  async getStocks(@Query('warehouse') warehouse?: WarehouseLocation) {
    const stocks = await this.inventoryService.getStocks(warehouse);
    return { status: 'success', total: stocks.length, stocks };
  }

  /**
   * Проверить алерты заканчивающегося товара на СВХ (<= 1 шт)
   * GET /inventory/alerts
   */
  @Get('alerts')
  async getAlerts() {
    const alerts = await this.inventoryService.getLowStockAlerts();
    return { status: 'success', ...alerts };
  }

  /**
   * Переместить товар между складами (MAIN -> SVH)
   * POST /inventory/transfer
   */
  @Post('transfer')
  async transfer(@Body() body: any) {
    const movement = await this.inventoryService.transferStock(body);
    return { status: 'success', message: 'Перемещение успешно выполнено', movement };
  }

  /**
   * Журнал складских движений
   * GET /inventory/movements?sku=34316
   */
  @Get('movements')
  async getMovements(@Query('sku') sku?: string, @Query('limit') limit?: string) {
    const movements = await this.inventoryService.getMovements(sku, limit ? Number(limit) : 50);
    return { status: 'success', total: movements.length, movements };
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WarehouseType } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(@Query('warehouse') warehouse?: WarehouseType, @Query('lowStock') lowStock?: string) {
    return this.inventoryService.findAll(warehouse, lowStock === 'true');
  }

  @Get('stats')
  getStats() {
    return this.inventoryService.getStats();
  }

  @Get('alerts')
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @Get('product/:productId')
  findByProduct(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.findByProduct(productId);
  }

  @Get('movements')
  getMovements(
    @Query('productId') productId?: string,
    @Query('warehouse') warehouse?: string,
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovements(
      productId ? parseInt(productId, 10) : undefined,
      warehouse,
      type,
      fromDate,
      toDate,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Post('adjust')
  adjust(@Body() body: any) {
    return this.inventoryService.adjust(body.productId, body);
  }

  @Post('move')
  move(@Body() body: any) {
    return this.inventoryService.move(body);
  }

  @Patch(':productId/min-stock')
  setMinStock(@Param('productId', ParseIntPipe) productId: number, @Body() body: any) {
    return this.inventoryService.setMinStock(productId, body.warehouse, body.minStockLevel);
  }
}

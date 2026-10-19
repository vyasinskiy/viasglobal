import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AnalyticsService } from './analytics.service.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('margin')
  getMarginReport(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('productId') productId?: any,
  ) {
    return this.analyticsService.getMarginReport(
      fromDate,
      toDate,
      productId ? Number(productId) : undefined,
    );
  }

  @Get('supplier-performance')
  getSupplierPerformance() {
    return this.analyticsService.getSupplierPerformance();
  }

  @Get('sales-trend')
  getSalesTrend(
    @Query('days') days?: any,
    @Query('platformId') platformId?: any,
  ) {
    return this.analyticsService.getSalesTrend(
      days ? Number(days) : undefined,
      platformId ? Number(platformId) : undefined,
    );
  }

  @Get('inventory-turnover')
  getInventoryTurnover() {
    return this.analyticsService.getInventoryTurnover();
  }
}
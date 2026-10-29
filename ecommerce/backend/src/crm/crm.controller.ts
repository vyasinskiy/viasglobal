import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { BrandStatus, DistributorStatus, PurchaseOrderStatus } from '@prisma/client';

/**
 * REST API контроллер для веб-интерфейса Viasglobal E-Commerce CRM & WMS
 */
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  /**
   * Сводная статистика дашборда CRM
   * GET /crm/dashboard
   */
  @Get('dashboard')
  async getDashboard() {
    return this.crmService.getDashboardStats();
  }

  /**
   * Товары брендов в работе (ContractedFilteredProductsView / ContractedAllProductsView)
   * GET /crm/products/contracted
   */
  @Get('products/contracted')
  async getContractedProducts(
    @Query('mode') mode?: 'filtered' | 'all',
    @Query('includeVatOnFees') includeVatOnFees?: string,
    @Query('brand') brand?: string,
    @Query('distributor') distributor?: string,
    @Query('feeStatus') feeStatus?: string,
    @Query('onlyProfitable') onlyProfitable?: string,
    @Query('search') search?: string,
  ) {
    return this.crmService.getContractedProducts({
      mode: mode === 'all' ? 'all' : 'filtered',
      includeVatOnFees: includeVatOnFees !== 'false',
      brand,
      distributor,
      feeStatus,
      onlyProfitable: onlyProfitable === 'true',
      search,
    });
  }

  /**
   * Оптовые кандидаты (CandidatesProductsView / WholesaleCandidatesView)
   * GET /crm/products/candidates
   */
  @Get('products/candidates')
  async getCandidatesProducts(
    @Query('search') search?: string,
    @Query('onlyClean') onlyClean?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getCandidatesProducts({
      search,
      onlyClean: onlyClean === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Поиск и просмотр каталога ASIN (AsinView)
   * GET /crm/products/asins
   */
  @Get('products/asins')
  async getAsinCatalog(
    @Query('search') search?: string,
    @Query('brand') brand?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getAsinCatalog({
      search,
      brand,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Детальная карточка конкретного ASIN
   * GET /crm/products/asin/:code
   */
  @Get('products/asin/:code')
  async getAsinDetails(@Param('code') code: string) {
    return this.crmService.getAsinDetails(code);
  }

  /**
   * Список всех брендов с количеством товаров и фильтрацией
   * GET /crm/brands
   */
  @Get('brands')
  async getBrands(
    @Query('status') status?: BrandStatus | string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getBrands({
      status,
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Обновление статуса бренда и заметок для Welcome Letter
   * PATCH /crm/brands/:id
   */
  @Patch('brands/:id')
  async updateBrand(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status?: BrandStatus; notes?: string },
  ) {
    return this.crmService.updateBrand(id, body);
  }

  /**
   * Список производителей и их сырых алиасов Keepa (ManufacturerAlias)
   * GET /crm/manufacturers
   */
  @Get('manufacturers')
  async getManufacturers(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getManufacturers({
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Список подтвержденных связок приватных лейблов (PrivateLabelView)
   * GET /crm/private-labels
   */
  @Get('private-labels')
  async getPrivateLabels(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getPrivateLabels({
      search,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Расширенный список дистрибьюторов для воронки CRM
   * GET /crm/distributors
   */
  @Get('distributors')
  async getDistributors(
    @Query('status') status?: DistributorStatus | string,
    @Query('search') search?: string,
  ) {
    return this.crmService.getDistributorsList({ status, search });
  }

  /**
   * Полная детальная карточка дистрибьютора (контакты, письма, прайсы, заказы)
   * GET /crm/distributors/:id
   */
  @Get('distributors/:id')
  async getDistributorDetails(@Param('id', ParseIntPipe) id: number) {
    return this.crmService.getDistributorFullDetails(id);
  }

  /**
   * Поиск по базе входящих/исходящих писем поставщиков (Hostinger IMAP, Read-Only)
   * GET /crm/emails
   */
  @Get('emails')
  async getEmails(
    @Query('distributorId') distributorId?: string,
    @Query('q') q?: string,
    @Query('hasAttachments') hasAttachments?: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.searchDistributorEmails({
      distributorId: distributorId ? Number(distributorId) : undefined,
      q,
      hasAttachments: hasAttachments === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Список всех заказов на закупку по всем поставщикам
   * GET /crm/orders
   */
  @Get('orders')
  async getAllOrders(
    @Query('distributorId') distributorId?: string,
    @Query('status') status?: PurchaseOrderStatus | string,
    @Query('search') search?: string,
  ) {
    return this.crmService.getAllPurchaseOrders({
      distributorId: distributorId ? Number(distributorId) : undefined,
      status,
      search,
    });
  }

  /**
   * Сводный обзор очередей Keepa API, разрешенных категорий и выгрузок
   * GET /crm/keepa/overview
   */
  @Get('keepa/overview')
  async getKeepaOverview() {
    return this.crmService.getKeepaOverview();
  }
}


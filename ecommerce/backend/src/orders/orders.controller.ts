import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderDocumentType } from '@prisma/client';

/**
 * REST API контроллер управления закупками и юнит-экономикой партий
 */
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Список заказов поставщика
   * GET /orders?distributor=...
   */
  @Get()
  async getOrders(@Query('distributor') distributor?: string) {
    if (!distributor) {
      return { status: 'error', message: 'Укажите параметр ?distributor=...' };
    }
    const orders = await this.ordersService.getOrdersByDistributor(distributor);
    return { status: 'success', total: orders.length, orders };
  }

  /**
   * Детальная карточка заказа и расчет юнит-экономики
   * GET /orders/:idOrNumber
   */
  @Get(':idOrNumber')
  async getOrderDetails(@Param('idOrNumber') idOrNumber: string) {
    const details = await this.ordersService.getOrderDetails(idOrNumber);
    return { status: 'success', data: details };
  }

  /**
   * Создание нового заказа на закупку
   * POST /orders
   */
  @Post()
  async createOrder(@Body() body: any) {
    const created = await this.ordersService.createOrder(body);
    return { status: 'success', message: 'Заказ успешно создан', order: created };
  }

  /**
   * Проведение приемки поставки (замеры, пересчет, фото, разделение СВХ/MAIN)
   * POST /orders/:id/receive
   */
  @Post(':id/receive')
  async receiveOrder(@Param('id') id: string, @Body() body: any) {
    const result = await this.ordersService.receiveOrder(Number(id), body);
    return { status: 'success', message: 'Приемка товара успешно завершена', order: result };
  }

  /**
   * Прикрепление документа или фото к заказу
   * POST /orders/:id/documents
   */
  @Post(':id/documents')
  async attachDocument(@Param('id') id: string, @Body() body: any) {
    const doc = await this.ordersService.attachDocument(Number(id), body);
    return { status: 'success', message: 'Документ успешно прикреплен', document: doc };
  }
}

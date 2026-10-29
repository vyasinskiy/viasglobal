import { Controller, Get, Post, Patch, Put, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';

/**
 * REST API контроллер управления закупками, двухфазной приемкой товара и юнит-экономикой партий
 */
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Список заказов (всех или с фильтрацией по поставщику, статусу и поисковому запросу)
   * GET /orders[?distributor=...&status=...&search=...]
   */
  @Get()
  async getOrders(
    @Query('distributor') distributor?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    // Получаем список заказов с учетом переданных фильтров (или все заказы, если фильтры не указаны)
    const orders = await this.ordersService.getOrders({ distributor, status, search });
    return { status: 'success', total: orders.length, orders };
  }

  /**
   * Сводный реестр заказов с проверкой загрузки фактур и банковских оплат в налоговый сервис Taxfix
   * GET /orders/taxfix/status[?onlyPending=true&distributor=...]
   */
  @Get('taxfix/status')
  async getTaxfixStatus(
    @Query('onlyPending') onlyPending?: string,
    @Query('distributor') distributor?: string,
  ) {
    const isOnlyPending = onlyPending === 'true' || onlyPending === '1';
    const summary = await this.ordersService.getTaxfixStatusList({
      onlyPending: isOnlyPending,
      distributor,
    });
    return {
      status: 'success',
      ...summary,
    };
  }

  /**
   * Детальная карточка заказа, обязательный чек-лист приемки и расчет юнит-экономики
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
   * Проведение приемки поставки или корректировки уже принятой партии:
   * - даты получения (actualDeliveryDate) и приемки (receivingDate),
   * - список документов и явный пропуск с причиной (skippedDocuments),
   * - тройная сверка EAN (Заказ <-> Albarán <-> Коробка),
   * - фото всей партии и отдельных айтемов с разных сторон,
   * - комментарии приемки и дельта-корректировка остатков СВХ/MAIN.
   * POST /orders/:id/receive
   */
  @Post(':id/receive')
  async receiveOrder(@Param('id') id: string, @Body() body: any) {
    const result = await this.ordersService.receiveOrder(id, body);
    const isCorrection = result?.receivingSummary?.isCorrection === true;
    return {
      status: 'success',
      message: isCorrection
        ? 'Корректировка приемки товара успешно выполнена (складские остатки пересчитаны по дельте)'
        : 'Приемка товара успешно завершена',
      order: result,
      receivingSummary: result?.receivingSummary,
    };
  }

  /**
   * Корректировка ранее проведенной приемки поставки (алиас к POST /orders/:id/receive)
   * PATCH /orders/:id/receive
   */
  @Patch(':id/receive')
  async correctReceivedOrderPatch(@Param('id') id: string, @Body() body: any) {
    return this.receiveOrder(id, body);
  }

  /**
   * Корректировка ранее проведенной приемки поставки (алиас к POST /orders/:id/receive)
   * PUT /orders/:id/receive
   */
  @Put(':id/receive')
  async correctReceivedOrderPut(@Param('id') id: string, @Body() body: any) {
    return this.receiveOrder(id, body);
  }

  /**
   * Прикрепление документа или фото к заказу (всей партии или конкретной позиции по sku / purchaseOrderItemId)
   * POST /orders/:id/documents
   */
  @Post(':id/documents')
  async attachDocument(@Param('id') id: string, @Body() body: any) {
    const doc = await this.ordersService.attachDocument(id, body);
    return { status: 'success', message: 'Документ успешно прикреплен', document: doc };
  }

  /**
   * Загрузка счета-фактуры (INVOICE), подтверждения оплаты из банка (PAYMENT_RECEIPT)
   * и обновление статуса загрузки/линковки в налоговом сервисе Taxfix
   * POST /orders/:id/taxfix
   */
  @Post(':id/taxfix')
  async updateTaxfixPost(@Param('id') id: string, @Body() body: any) {
    const result = await this.ordersService.updateTaxfixCompliance(id, body);
    return {
      status: 'success',
      message: result.taxfixCompliance.isCompliant
        ? 'Счет-фактура и банковская оплата успешно прикреплены и слинкованы в Taxfix'
        : 'Данные Taxfix и документы обновлены (проверьте pendingActions в taxfixCompliance)',
      ...result,
    };
  }

  /**
   * Частичное обновление статуса Taxfix или дозагрузка банковской выписки / фактуры (алиас к POST /orders/:id/taxfix)
   * PATCH /orders/:id/taxfix
   */
  @Patch(':id/taxfix')
  async updateTaxfixPatch(@Param('id') id: string, @Body() body: any) {
    return this.updateTaxfixPost(id, body);
  }
}

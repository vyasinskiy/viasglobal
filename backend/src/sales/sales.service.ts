import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarehouseLocation, StockMovementType, SalesOrderStatus } from '@prisma/client';

/**
 * Сервис учета продаж (Amazon FBM/FBA), партионного списания FIFO и контроля пополнения СВХ
 */
@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Зафиксировать продажу на маркетплейсе (Amazon), списать товар со склада СВХ
   * и привязать к конкретной партии закупки по методу FIFO.
   */
  async recordSale(data: {
    platform?: string; // По умолчанию 'AMAZON'
    orderNumber: string; // Номер заказа Amazon (Order ID)
    orderDate?: Date | string;
    fulfillmentChannel?: string; // По умолчанию 'FBM' (доставка с СВХ)
    warehouse?: WarehouseLocation; // По умолчанию SVH
    customerCity?: string;
    customerCountry?: string;
    trackingNumber?: string;
    notes?: string;
    items: Array<{
      sku: string;
      quantity: number;
      salePrice: number; // Цена продажи единицы (€)
      platformFee?: number; // Комиссия Amazon Referral Fee (€)
      shippingCost?: number; // Затраты на доставку покупателю (€)
    }>;
  }) {
    const warehouse = data.warehouse ?? WarehouseLocation.SVH;
    const platform = data.platform ?? 'AMAZON';
    const fulfillmentChannel = data.fulfillmentChannel ?? 'FBM';
    const orderDate = data.orderDate ? new Date(data.orderDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      // 1. Проверяем, не был ли заказ уже зарегистрирован ранее
      const existingOrder = await tx.salesOrder.findUnique({
        where: { orderNumber: data.orderNumber.trim() },
      });
      if (existingOrder) {
        throw new BadRequestException(`Заказ с номером "${data.orderNumber}" уже зарегистрирован в системе`);
      }

      let totalAmount = 0;
      let totalPlatformFees = 0;
      let totalShippingFees = 0;

      // Массив предупреждений об остатках на СВХ
      const stockAlerts: Array<{
        sku: string;
        remainingSvhQuantity: number;
        mainStockQuantity: number;
        message: string;
      }> = [];

      // Предварительно создаем заказ продаж
      const salesOrder = await tx.salesOrder.create({
        data: {
          platform,
          orderNumber: data.orderNumber.trim(),
          orderDate,
          status: SalesOrderStatus.SHIPPED,
          fulfillmentChannel,
          warehouse,
          totalAmount: 0,
          platformFees: 0,
          shippingFee: 0,
          netAmount: 0,
          customerCity: data.customerCity,
          customerCountry: data.customerCountry ?? 'ES',
          trackingNumber: data.trackingNumber,
          notes: data.notes,
        },
      });

      for (const item of data.items) {
        const cleanSku = item.sku.trim();
        const quantity = item.quantity;
        const salePrice = item.salePrice;
        const platformFee = item.platformFee ?? Math.round(salePrice * 0.15 * 100) / 100;
        const shippingCost = item.shippingCost ?? 0;

        totalAmount += salePrice * quantity;
        totalPlatformFees += platformFee * quantity;
        totalShippingFees += shippingCost * quantity;

        // 2. Проверяем и списываем остаток на складе (по дефолту СВХ)
        const stock = await tx.warehouseStock.findUnique({
          where: {
            warehouse_sku: {
              warehouse,
              sku: cleanSku,
            },
          },
        });

        if (!stock || stock.quantity < quantity) {
          throw new BadRequestException(
            `Недостаточно товара на складе ${warehouse} для списания. SKU: ${cleanSku}. В наличии: ${stock?.quantity ?? 0} шт, требуется: ${quantity} шт.`,
          );
        }

        const remainingQty = stock.quantity - quantity;

        await tx.warehouseStock.update({
          where: { id: stock.id },
          data: { quantity: remainingQty },
        });

        // 3. Фиксируем складское движение списания (SALE_OUT)
        await tx.stockMovement.create({
          data: {
            sku: cleanSku,
            asinId: stock.asinId,
            fromWarehouse: warehouse,
            type: StockMovementType.SALE_OUT,
            quantity,
            salesOrderId: salesOrder.id,
            notes: `Продажа ${platform} (Заказ: ${data.orderNumber}): списано со склада ${warehouse}`,
          },
        });

        // 4. Партионный учет (FIFO) - находим партии закупки, из которых пришел товар
        const batchItems = await tx.purchaseOrderItem.findMany({
          where: {
            sku: cleanSku,
            quantityReceived: { gt: 0 },
          },
          include: {
            purchaseOrder: true,
            allocations: true,
          },
          orderBy: {
            purchaseOrder: { orderDate: 'asc' },
          },
        });

        let qtyToAllocate = quantity;
        let weightedCostPrice = 0;
        let totalAllocatedUnits = 0;

        // Создаем строку заказа продаж
        const salesOrderItem = await tx.salesOrderItem.create({
          data: {
            salesOrderId: salesOrder.id,
            sku: cleanSku,
            asinId: stock.asinId,
            quantity,
            salePrice,
            platformFee,
            shippingCost,
            costPrice: null, // Рассчитаем ниже по факту списания из партий
            netProfit: null,
          },
        });

        for (const batchItem of batchItems) {
          if (qtyToAllocate <= 0) break;

          const alreadyAllocated = batchItem.allocations.reduce((sum, a) => sum + a.quantity, 0);
          const availableInBatch = Math.max(0, batchItem.quantityReceived - alreadyAllocated);

          if (availableInBatch > 0) {
            const takeFromBatch = Math.min(qtyToAllocate, availableInBatch);

            await tx.batchSalesAllocation.create({
              data: {
                purchaseOrderItemId: batchItem.id,
                salesOrderItemId: salesOrderItem.id,
                quantity: takeFromBatch,
                costPriceAtAllocation: batchItem.costPrice,
              },
            });

            weightedCostPrice += batchItem.costPrice * takeFromBatch;
            totalAllocatedUnits += takeFromBatch;
            qtyToAllocate -= takeFromBatch;
          }
        }

        // Если в партиях было оприходовано меньше, чем продано, используем себестоимость последней партии
        const avgCostPrice =
          totalAllocatedUnits > 0
            ? Math.round((weightedCostPrice / totalAllocatedUnits) * 100) / 100
            : (batchItems[batchItems.length - 1]?.costPrice ?? 0);

        // Чистая прибыль с единицы товара
        const netProfitPerUnit = Math.round((salePrice - platformFee - shippingCost - avgCostPrice) * 100) / 100;

        await tx.salesOrderItem.update({
          where: { id: salesOrderItem.id },
          data: {
            costPrice: avgCostPrice,
            netProfit: netProfitPerUnit,
          },
        });

        // 5. Проверка триггера окончания остатка на СВХ:
        // Если остаток на СВХ опустился до порога (<= minStockAlert, по умолчанию <= 1)
        if (warehouse === WarehouseLocation.SVH && remainingQty <= stock.minStockAlert) {
          const mainStock = await tx.warehouseStock.findUnique({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: cleanSku,
              },
            },
          });

          const mainQty = mainStock ? Math.max(0, mainStock.quantity - mainStock.reservedQuantity) : 0;
          stockAlerts.push({
            sku: cleanSku,
            remainingSvhQuantity: remainingQty,
            mainStockQuantity: mainQty,
            message: `⚠️ ВНИМАНИЕ: После продажи заказа ${data.orderNumber} на складе СВХ осталась ${remainingQty} шт (SKU: ${cleanSku})! На основном складе MAIN есть ${mainQty} шт. Необходимо пополнить СВХ на 3 шт со склада MAIN.`,
          });
        }
      }

      // Обновляем итоговые суммы заказа продаж
      const netAmount = Math.round((totalAmount - totalPlatformFees - totalShippingFees) * 100) / 100;

      const finalOrder = await tx.salesOrder.update({
        where: { id: salesOrder.id },
        data: {
          totalAmount: Math.round(totalAmount * 100) / 100,
          platformFees: Math.round(totalPlatformFees * 100) / 100,
          shippingFee: Math.round(totalShippingFees * 100) / 100,
          netAmount,
        },
        include: {
          items: {
            include: {
              allocations: {
                include: {
                  purchaseOrderItem: {
                    include: {
                      purchaseOrder: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        order: finalOrder,
        stockAlerts,
      };
    });
  }

  /**
   * Получить список всех продаж
   */
  async getSalesOrders(platform?: string) {
    const where: any = {};
    if (platform) {
      where.platform = platform.toUpperCase();
    }

    return this.prisma.salesOrder.findMany({
      where,
      include: {
        items: true,
        _count: { select: { items: true } },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  /**
   * Сквозная прослеживаемость партии: какие заказы покупателей были покрыты из указанного заказа поставщика
   */
  async getBatchSalesTrace(purchaseOrderIdOrNumber: string | number) {
    let whereClause: any;
    if (typeof purchaseOrderIdOrNumber === 'number' || (!isNaN(Number(purchaseOrderIdOrNumber)) && !String(purchaseOrderIdOrNumber).includes('-'))) {
      whereClause = { id: Number(purchaseOrderIdOrNumber) };
    } else {
      whereClause = { orderNumber: String(purchaseOrderIdOrNumber) };
    }

    const batch = await this.prisma.purchaseOrder.findFirst({
      where: whereClause,
      include: {
        distributor: true,
        items: {
          include: {
            allocations: {
              include: {
                salesOrderItem: {
                  include: {
                    salesOrder: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Партия поставщика "${purchaseOrderIdOrNumber}" не найдена`);
    }

    const itemsTrace = batch.items.map((item) => {
      const sales = item.allocations.map((alloc) => ({
        salesOrderNumber: alloc.salesOrderItem.salesOrder.orderNumber,
        platform: alloc.salesOrderItem.salesOrder.platform,
        orderDate: alloc.salesOrderItem.salesOrder.orderDate,
        customerCity: alloc.salesOrderItem.salesOrder.customerCity,
        customerCountry: alloc.salesOrderItem.salesOrder.customerCountry,
        quantitySoldFromBatch: alloc.quantity,
        salePrice: alloc.salesOrderItem.salePrice,
        platformFee: alloc.salesOrderItem.platformFee,
        shippingCost: alloc.salesOrderItem.shippingCost,
        costPriceAtAllocation: alloc.costPriceAtAllocation,
        netProfit: alloc.salesOrderItem.netProfit,
        totalProfitFromBatchUnits:
          alloc.salesOrderItem.netProfit !== null
            ? Math.round(alloc.salesOrderItem.netProfit * alloc.quantity * 100) / 100
            : null,
      }));

      const totalSold = sales.reduce((acc, s) => acc + s.quantitySoldFromBatch, 0);
      const totalProfit = sales.reduce((acc, s) => acc + (s.totalProfitFromBatchUnits ?? 0), 0);

      return {
        sku: item.sku,
        ean: item.ean,
        title: item.title,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        costPrice: item.costPrice,
        totalSoldFromBatch: totalSold,
        remainingInStock: Math.max(0, item.quantityReceived - totalSold),
        totalProfitGenerated: Math.round(totalProfit * 100) / 100,
        sales,
      };
    });

    return {
      purchaseOrderId: batch.id,
      purchaseOrderNumber: batch.orderNumber,
      supplier: batch.distributor.name,
      orderDate: batch.orderDate,
      totalGrossCost: batch.totalGross,
      itemsTrace,
    };
  }
}

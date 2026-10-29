import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrderStatus, WarehouseLocation, OrderDocumentType } from '@prisma/client';

/**
 * Сервис управления закупками у поставщиков, юнит-экономикой партий и первичным оприходованием
 */
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать новый заказ на закупку (партию)
   */
  async createOrder(data: {
    distributorId: number;
    orderNumber: string;
    orderDate?: Date | string;
    expectedDeliveryDate?: Date | string;
    shippingCost?: number;
    paymentMethod?: string;
    notes?: string;
    items: Array<{
      sku: string;
      ean?: string;
      asinId?: number;
      title: string;
      quantityOrdered: number;
      priceNetto: number;
      ecoTasa?: number;
    }>;
  }) {
    const shippingCost = data.shippingCost ?? 0;

    // Рассчитываем итоговые суммы по всем позициям заказа с учетом испанских налогов (21% IVA + 5.2% RE = 1.262)
    let subtotalNetto = 0;
    let totalEcoTasa = 0;
    let taxAmount = 0;
    let totalGross = 0;

    const itemsData = data.items.map((item) => {
      const ecoTasa = item.ecoTasa ?? 0;
      const baseWithEco = item.priceNetto + ecoTasa;
      // Себестоимость за штуку с налогами Recargo de Equivalencia
      const costPrice = Math.round(baseWithEco * 1.262 * 100) / 100;
      const itemTotalGross = Math.round(costPrice * item.quantityOrdered * 100) / 100;

      subtotalNetto += item.priceNetto * item.quantityOrdered;
      totalEcoTasa += ecoTasa * item.quantityOrdered;
      totalGross += itemTotalGross;

      return {
        sku: item.sku.trim(),
        ean: item.ean ? item.ean.trim() : null,
        asinId: item.asinId,
        title: item.title.trim(),
        quantityOrdered: item.quantityOrdered,
        priceNetto: item.priceNetto,
        ecoTasa,
        costPrice,
        totalCostGross: itemTotalGross,
      };
    });

    // Налоги составляют разницу между Gross и чистой базой с тасой
    taxAmount = Math.round((totalGross - (subtotalNetto + totalEcoTasa)) * 100) / 100;
    totalGross += shippingCost;

    return this.prisma.purchaseOrder.create({
      data: {
        distributorId: data.distributorId,
        orderNumber: data.orderNumber.trim(),
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
        shippingCost,
        subtotalNetto: Math.round(subtotalNetto * 100) / 100,
        totalEcoTasa: Math.round(totalEcoTasa * 100) / 100,
        taxAmount,
        totalGross: Math.round(totalGross * 100) / 100,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: PurchaseOrderStatus.CONFIRMED,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        distributor: true,
      },
    });
  }

  /**
   * Получить список всех заказов с опциональной фильтрацией по поставщику, статусу и поиску по товарам/номеру
   */
  async getOrders(filters?: { distributor?: string | number; status?: string; search?: string }) {
    // Формируем объект условий фильтрации для Prisma
    const where: any = {};

    // Если передан фильтр по дистрибьютору (ID, название компании или бренд в заметках)
    if (filters?.distributor !== undefined && String(filters.distributor).trim() !== '') {
      const distQuery = String(filters.distributor).trim();
      if (!isNaN(Number(distQuery))) {
        where.distributorId = Number(distQuery);
      } else {
        // Ищем дистрибьютора по имени или по упоминанию бренда в поле notes (например, KUKEN -> ALFA DYSER)
        const dist = await this.prisma.distributor.findFirst({
          where: {
            OR: [
              { name: { contains: distQuery, mode: 'insensitive' } },
              { notes: { contains: distQuery, mode: 'insensitive' } },
            ],
          },
        });
        if (!dist) {
          throw new NotFoundException(`Дистрибьютор "${distQuery}" не найден`);
        }
        where.distributorId = dist.id;
      }
    }

    // Если передан фильтр по статусу заказа (например, CONFIRMED, SHIPPED, PARTIALLY_RECEIVED, RECEIVED)
    if (filters?.status && filters.status.trim() !== '') {
      where.status = filters.status.trim().toUpperCase() as PurchaseOrderStatus;
    }

    // Если передан универсальный поисковый запрос (номер заказа, поставщик, SKU, EAN, название товара)
    if (filters?.search && filters.search.trim() !== '') {
      const q = filters.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { distributor: { name: { contains: q, mode: 'insensitive' } } },
        { distributor: { notes: { contains: q, mode: 'insensitive' } } },
        {
          items: {
            some: {
              OR: [
                { sku: { contains: q, mode: 'insensitive' } },
                { ean: { contains: q, mode: 'insensitive' } },
                { title: { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    // Запрашиваем заказы вместе с данными поставщика, позициями и документами
    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        distributor: { select: { id: true, name: true, email: true } },
        items: true,
        documents: true,
        _count: { select: { items: true, documents: true } },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  /**
   * Получить список всех заказов по дистрибьютору (по ID или имени)
   */
  async getOrdersByDistributor(distributorQuery: string | number) {
    // Делегируем вызов универсальному методу getOrders с фильтром по дистрибьютору
    return this.getOrders({ distributor: distributorQuery });
  }

  /**
   * Получить детальные данные заказа со сводной юнит-экономикой
   */
  async getOrderDetails(orderIdOrNumber: string | number) {
    let whereClause: any;

    if (typeof orderIdOrNumber === 'number' || (!isNaN(Number(orderIdOrNumber)) && !String(orderIdOrNumber).includes('-'))) {
      whereClause = { id: Number(orderIdOrNumber) };
    } else {
      whereClause = { orderNumber: String(orderIdOrNumber) };
    }

    const order = await this.prisma.purchaseOrder.findFirst({
      where: whereClause,
      include: {
        distributor: true,
        items: {
          include: {
            asin: {
              include: {
                productFinders: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                },
              },
            },
            allocations: {
              include: {
                salesOrderItem: {
                  include: {
                    salesOrder: true,
                  },
                },
              },
            },
            documents: true,
          },
        },
        documents: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Заказ "${orderIdOrNumber}" не найден`);
    }

    // Рассчитываем юнит-экономику партии и прогноз маржинальности
    const itemsEconomy = order.items.map((item) => {
      const snap = item.asin?.productFinders?.[0];
      const buyBoxPrice = snap?.buyBoxCurrent ?? snap?.newCurrent ?? null;
      const fbaFee = snap?.fBAPickPackFee ?? null;
      const referralFee = snap?.referralFee ?? (buyBoxPrice ? Math.round(buyBoxPrice * 0.15 * 100) / 100 : null);
      const totalFees = fbaFee !== null && referralFee !== null ? fbaFee + referralFee : null;

      // Чистая прибыль с единицы при продаже по BuyBox
      const estimatedNetProfitPerUnit =
        buyBoxPrice !== null && totalFees !== null
          ? Math.round((buyBoxPrice - totalFees - item.costPrice) * 100) / 100
          : null;

      // Ожидаемая суммарная прибыль с заказанного количества
      const estimatedTotalProfit =
        estimatedNetProfitPerUnit !== null
          ? Math.round(estimatedNetProfitPerUnit * item.quantityOrdered * 100) / 100
          : null;

      // Фактические продажи из данной партии
      const allocations = item.allocations || [];
      const totalAllocatedSold = allocations.reduce((acc, alloc) => acc + alloc.quantity, 0);
      const actualGrossRevenue = allocations.reduce(
        (acc, alloc) => acc + alloc.quantity * alloc.salesOrderItem.salePrice,
        0,
      );
      const actualNetProfit = allocations.reduce(
        (acc, alloc) => acc + (alloc.salesOrderItem.netProfit ?? 0) * alloc.quantity,
        0,
      );

      return {
        id: item.id,
        sku: item.sku,
        ean: item.ean,
        asin: item.asin?.code ?? null,
        title: item.title,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        priceNetto: item.priceNetto,
        ecoTasa: item.ecoTasa,
        costPriceGross: item.costPrice,
        totalCostGross: item.totalCostGross,
        packageMeasurements: {
          lengthCm: item.packageLengthCm,
          widthCm: item.packageWidthCm,
          heightCm: item.packageHeightCm,
          weightG: item.packageWeightG,
        },
        marketData: {
          buyBoxPrice,
          fbaFee,
          referralFee,
          totalFees,
          salesRank: snap?.salesRankCurrent ?? null,
        },
        unitEconomics: {
          estimatedNetProfitPerUnit,
          estimatedTotalProfit,
          roiPercent:
            estimatedNetProfitPerUnit !== null && item.costPrice > 0
              ? Math.round((estimatedNetProfitPerUnit / item.costPrice) * 10000) / 100
              : null,
          marginPercent:
            estimatedNetProfitPerUnit !== null && buyBoxPrice && buyBoxPrice > 0
              ? Math.round((estimatedNetProfitPerUnit / buyBoxPrice) * 10000) / 100
              : null,
        },
        salesProgress: {
          unitsSold: totalAllocatedSold,
          unitsRemaining: Math.max(0, item.quantityReceived - totalAllocatedSold),
          actualGrossRevenue: Math.round(actualGrossRevenue * 100) / 100,
          actualNetProfit: Math.round(actualNetProfit * 100) / 100,
        },
      };
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderDate: order.orderDate,
      expectedDeliveryDate: order.expectedDeliveryDate,
      actualDeliveryDate: order.actualDeliveryDate,
      supplier: {
        id: order.distributor.id,
        name: order.distributor.name,
        website: order.distributor.website,
        email: order.distributor.email,
      },
      financials: {
        shippingCost: order.shippingCost,
        subtotalNetto: order.subtotalNetto,
        totalEcoTasa: order.totalEcoTasa,
        taxAmount: order.taxAmount,
        totalGross: order.totalGross,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
      },
      items: itemsEconomy,
      documents: order.documents,
      stockMovements: order.stockMovements,
      notes: order.notes,
    };
  }

  /**
   * Выполнить приемку поставки (товара): пересчет, замеры, фото и автоматическое распределение по складам
   */
  async receiveOrder(
    orderId: number,
    data: {
      actualDeliveryDate?: Date | string;
      notes?: string;
      items: Array<{
        sku: string;
        quantityReceived: number;
        // Замеры упаковки
        packageLengthCm?: number;
        packageWidthCm?: number;
        packageHeightCm?: number;
        packageWeightG?: number;
        // Распределение по складам (по дефолту на СВХ идет 3 шт, остальное на Основной склад)
        svhQuantity?: number;
        mainQuantity?: number;
        itemNotes?: string;
      }>;
      documents?: Array<{
        documentType: OrderDocumentType;
        fileName: string;
        filePath: string;
        fileSize?: number;
        mimeType?: string;
        notes?: string;
      }>;
    },
  ) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Заказ ID ${orderId} не найден`);
    }

    const actualDate = data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      let allFullyReceived = true;

      for (const receiveItem of data.items) {
        const existingItem = order.items.find((i) => i.sku.toUpperCase() === receiveItem.sku.trim().toUpperCase());
        if (!existingItem) {
          throw new BadRequestException(`Артикул "${receiveItem.sku}" не найден в составе заказа ${order.orderNumber}`);
        }

        // Обновляем принятое количество и физические замеры упаковки
        await tx.purchaseOrderItem.update({
          where: { id: existingItem.id },
          data: {
            quantityReceived: receiveItem.quantityReceived,
            packageLengthCm: receiveItem.packageLengthCm,
            packageWidthCm: receiveItem.packageWidthCm,
            packageHeightCm: receiveItem.packageHeightCm,
            packageWeightG: receiveItem.packageWeightG,
            notes: receiveItem.itemNotes,
          },
        });

        if (receiveItem.quantityReceived < existingItem.quantityOrdered) {
          allFullyReceived = false;
        }

        // Логика разделения по складам:
        // По дефолту на СВХ выделяется до 3 штук (или всё количество, если меньше 3),
        // а остальное количество направляется на основной склад MAIN.
        const targetSvh =
          receiveItem.svhQuantity !== undefined
            ? receiveItem.svhQuantity
            : Math.min(3, receiveItem.quantityReceived);
        const targetMain =
          receiveItem.mainQuantity !== undefined
            ? receiveItem.mainQuantity
            : Math.max(0, receiveItem.quantityReceived - targetSvh);

        // 1. Оприходование на склад СВХ (SVH)
        if (targetSvh > 0) {
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.SVH,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.SVH,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: targetSvh,
              minStockAlert: 1, // По дефолту порог предупреждения для СВХ равен 1 шт
            },
            update: {
              quantity: { increment: targetSvh },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              toWarehouse: WarehouseLocation.SVH,
              type: 'RECEIPT',
              quantity: targetSvh,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: `Приемка поставки ${order.orderNumber}: оприходовано на СВХ`,
            },
          });
        }

        // 2. Оприходование на Основной склад (MAIN)
        if (targetMain > 0) {
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.MAIN,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: targetMain,
              minStockAlert: 0,
            },
            update: {
              quantity: { increment: targetMain },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              toWarehouse: WarehouseLocation.MAIN,
              type: 'RECEIPT',
              quantity: targetMain,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: `Приемка поставки ${order.orderNumber}: оприходовано на Основной склад (MAIN)`,
            },
          });
        }
      }

      // Сохраняем прикрепленные документы (Albarán, фото замеров, фото упаковок)
      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          await tx.orderDocument.create({
            data: {
              distributorId: order.distributorId,
              purchaseOrderId: order.id,
              documentType: doc.documentType,
              fileName: doc.fileName,
              filePath: doc.filePath,
              fileSize: doc.fileSize,
              mimeType: doc.mimeType,
              notes: doc.notes,
            },
          });
        }
      }

      // Обновляем статус заказа: RECEIVED (или PARTIALLY_RECEIVED)
      const updatedOrder = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: allFullyReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED,
          actualDeliveryDate: actualDate,
          notes: data.notes ?? order.notes,
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Прикрепить документ к заказу (Albarán, Factura, чек, фото)
   */
  async attachDocument(orderId: number, doc: {
    documentType: OrderDocumentType;
    fileName: string;
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    notes?: string;
    purchaseOrderItemId?: number;
  }) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Заказ ID ${orderId} не найден`);
    }

    return this.prisma.orderDocument.create({
      data: {
        distributorId: order.distributorId,
        purchaseOrderId: order.id,
        purchaseOrderItemId: doc.purchaseOrderItemId,
        documentType: doc.documentType,
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        notes: doc.notes,
      },
    });
  }
}

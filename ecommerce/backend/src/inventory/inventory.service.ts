import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarehouseLocation, StockMovementType } from '@prisma/client';

/**
 * Сервис управления складскими остатками, перемещениями СВХ/MAIN и системой алертов
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить текущие остатки по всем или выбранному складу
   */
  async getStocks(warehouse?: WarehouseLocation) {
    const where: any = {};
    if (warehouse) {
      where.warehouse = warehouse;
    }

    const stocks = await this.prisma.warehouseStock.findMany({
      where,
      include: {
        asin: {
          select: {
            code: true,
            brand: { select: { name: true } },
            productFinders: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        },
      },
      orderBy: [{ warehouse: 'asc' }, { sku: 'asc' }],
    });

    return stocks.map((item) => ({
      id: item.id,
      warehouse: item.warehouse,
      sku: item.sku,
      title: item.title,
      asin: item.asin?.code ?? null,
      brand: item.asin?.brand?.name ?? null,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      availableQuantity: Math.max(0, item.quantity - item.reservedQuantity),
      minStockAlert: item.minStockAlert,
      isLowStock: item.quantity <= item.minStockAlert,
      buyBoxPrice: item.asin?.productFinders?.[0]?.buyBoxCurrent ?? null,
      updatedAt: item.updatedAt,
    }));
  }

  /**
   * Проверить склад СВХ на товары с низким остатком (<= 1 шт) и сформировать рекомендации пополнения с Основного склада
   */
  async getLowStockAlerts() {
    // 1. Получаем все остатки на СВХ, где количество подошло к порогу (по умолчанию <= 1)
    const svhStocks = await this.prisma.warehouseStock.findMany({
      where: {
        warehouse: WarehouseLocation.SVH,
      },
      include: {
        asin: {
          select: {
            code: true,
            brand: { select: { name: true } },
          },
        },
      },
    });

    const lowStockItems = svhStocks.filter((s) => s.quantity <= s.minStockAlert);
    const alerts: Array<{
      sku: string;
      title: string | null;
      asin: string | null;
      svhQuantity: number;
      minStockAlert: number;
      mainQuantity: number;
      status: 'NEEDS_TRANSFER' | 'OUT_OF_STOCK';
      recommendedTransferQty: number;
      message: string;
    }> = [];

    for (const svhItem of lowStockItems) {
      // Проверяем запас этого же SKU на Основном складе (MAIN)
      const mainStock = await this.prisma.warehouseStock.findUnique({
        where: {
          warehouse_sku: {
            warehouse: WarehouseLocation.MAIN,
            sku: svhItem.sku,
          },
        },
      });

      const mainQty = mainStock ? Math.max(0, mainStock.quantity - mainStock.reservedQuantity) : 0;

      if (mainQty > 0) {
        // На основном складе есть товар -> рекомендуем перевезти порцию (дефолт 3 шт или сколько есть)
        const recommendedQty = Math.min(3, mainQty);
        alerts.push({
          sku: svhItem.sku,
          title: svhItem.title,
          asin: svhItem.asin?.code ?? null,
          svhQuantity: svhItem.quantity,
          minStockAlert: svhItem.minStockAlert,
          mainQuantity: mainQty,
          status: 'NEEDS_TRANSFER',
          recommendedTransferQty: recommendedQty,
          message: `⚠️ Товар заканчивается на СВХ! SKU: ${svhItem.sku} (${svhItem.title ?? 'Товар'}). На СВХ осталось: ${svhItem.quantity} шт. На основном складе (MAIN) в наличии: ${mainQty} шт. Рекомендуется пополнить СВХ на ${recommendedQty} шт со склада MAIN.`,
        });
      } else {
        // Товар закончился и на СВХ, и на Основном складе!
        alerts.push({
          sku: svhItem.sku,
          title: svhItem.title,
          asin: svhItem.asin?.code ?? null,
          svhQuantity: svhItem.quantity,
          minStockAlert: svhItem.minStockAlert,
          mainQuantity: 0,
          status: 'OUT_OF_STOCK',
          recommendedTransferQty: 0,
          message: `🚨 Товар полностью исчерпан! SKU: ${svhItem.sku} (${svhItem.title ?? 'Товар'}). На СВХ: ${svhItem.quantity} шт, на складе MAIN: 0 шт. Требуется срочный дозаказ поставщику!`,
        });
      }
    }

    return {
      totalAlerts: alerts.length,
      alerts,
    };
  }

  /**
   * Переместить товар между складами (например, MAIN -> SVH при пополнении буфера)
   */
  async transferStock(data: {
    sku: string;
    fromWarehouse: WarehouseLocation;
    toWarehouse: WarehouseLocation;
    quantity: number;
    notes?: string;
  }) {
    if (data.fromWarehouse === data.toWarehouse) {
      throw new BadRequestException('Склад списания и склад назначения не могут совпадать');
    }
    if (data.quantity <= 0) {
      throw new BadRequestException('Количество для перемещения должно быть больше 0');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Проверяем наличие на складе-источнике
      const sourceStock = await tx.warehouseStock.findUnique({
        where: {
          warehouse_sku: {
            warehouse: data.fromWarehouse,
            sku: data.sku,
          },
        },
      });

      if (!sourceStock || sourceStock.quantity < data.quantity) {
        throw new BadRequestException(
          `Недостаточно товара на складе ${data.fromWarehouse}. В наличии: ${sourceStock?.quantity ?? 0} шт, запрошено: ${data.quantity} шт.`,
        );
      }

      // 2. Списываем с исходного склада
      await tx.warehouseStock.update({
        where: { id: sourceStock.id },
        data: { quantity: { decrement: data.quantity } },
      });

      // 3. Зачисляем на целевой склад
      await tx.warehouseStock.upsert({
        where: {
          warehouse_sku: {
            warehouse: data.toWarehouse,
            sku: data.sku,
          },
        },
        create: {
          warehouse: data.toWarehouse,
          sku: data.sku,
          asinId: sourceStock.asinId,
          title: sourceStock.title,
          quantity: data.quantity,
          minStockAlert: data.toWarehouse === WarehouseLocation.SVH ? 1 : 0,
        },
        update: {
          quantity: { increment: data.quantity },
        },
      });

      // 4. Фиксируем перемещение в журнале StockMovement
      const movement = await tx.stockMovement.create({
        data: {
          sku: data.sku,
          asinId: sourceStock.asinId,
          fromWarehouse: data.fromWarehouse,
          toWarehouse: data.toWarehouse,
          type: StockMovementType.TRANSFER,
          quantity: data.quantity,
          notes: data.notes ?? `Внутреннее перемещение: ${data.fromWarehouse} -> ${data.toWarehouse}`,
        },
      });

      return movement;
    });
  }

  /**
   * Получить журнал движений товаров
   */
  async getMovements(sku?: string, limit: number = 50) {
    const where: any = {};
    if (sku) {
      where.sku = sku.trim();
    }

    return this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        asin: { select: { code: true } },
        purchaseOrder: { select: { orderNumber: true, status: true } },
        salesOrder: { select: { orderNumber: true, platform: true } },
      },
    });
  }
}

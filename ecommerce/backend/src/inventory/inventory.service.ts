import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType, WarehouseType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(warehouse?: WarehouseType, lowStock?: boolean) {
    const where: any = {};
    if (warehouse) {
      where.warehouse = warehouse;
    }
    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: { product: { select: { sku: true, name: true } } },
      orderBy: { product: { name: 'asc' } },
    });
    if (lowStock) {
      return items.filter(
        (item) =>
          item.minStockLevel !== null &&
          item.quantity - item.reservedQuantity <= item.minStockLevel,
      );
    }
    return items;
  }

  async findByProduct(productId: number) {
    return this.prisma.inventoryItem.findMany({
      where: { productId },
      include: { product: { select: { sku: true, name: true } } },
      orderBy: { warehouse: 'asc' },
    });
  }

  async getMovements(
    productId?: number,
    warehouse?: string,
    type?: string,
    fromDate?: string,
    toDate?: string,
    limit?: number,
  ) {
    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    if (warehouse) {
      where.warehouse = warehouse as WarehouseType;
    }
    if (type) {
      where.type = type as MovementType;
    }
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) {
        where.date.gte = new Date(fromDate);
      }
      if (toDate) {
        where.date.lte = new Date(toDate);
      }
    }
    return this.prisma.inventoryMovement.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async adjust(
    productId: number,
    data: { warehouse: WarehouseType; quantity: number; notes?: string },
  ) {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { productId_warehouse: { productId, warehouse: data.warehouse } },
    });
    const delta = data.quantity - (existing?.quantity ?? 0);
    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.upsert({
        where: { productId_warehouse: { productId, warehouse: data.warehouse } },
        create: { productId, warehouse: data.warehouse, quantity: data.quantity },
        update: { quantity: data.quantity },
      });
      return tx.inventoryMovement.create({
        data: {
          productId,
          warehouse: data.warehouse,
          type: 'ADJUST',
          quantity: delta,
          notes: data.notes,
        },
      });
    });
  }

  async move(data: {
    productId: number;
    warehouse: WarehouseType;
    type: MovementType;
    quantity: number;
    referenceType?: string;
    referenceId?: number;
    notes?: string;
  }) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { productId_warehouse: { productId: data.productId, warehouse: data.warehouse } },
    });
    const currentQuantity = item?.quantity ?? 0;
    const currentReserved = item?.reservedQuantity ?? 0;

    let quantity = currentQuantity;
    let reservedQuantity = currentReserved;

    switch (data.type) {
      case 'IN':
      case 'RETURN':
        quantity += data.quantity;
        break;
      case 'OUT':
        if (currentQuantity - data.quantity < 0) {
          throw new BadRequestException('Insufficient quantity in stock');
        }
        quantity -= data.quantity;
        break;
      case 'RESERVE':
        reservedQuantity += data.quantity;
        break;
      case 'UNRESERVE':
        if (currentReserved - data.quantity < 0) {
          throw new BadRequestException('Insufficient reserved quantity');
        }
        reservedQuantity -= data.quantity;
        break;
      case 'ADJUST':
        quantity = data.quantity;
        break;
      default:
        throw new BadRequestException('Invalid movement type');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.inventoryItem.upsert({
        where: {
          productId_warehouse: { productId: data.productId, warehouse: data.warehouse },
        },
        create: {
          productId: data.productId,
          warehouse: data.warehouse,
          quantity,
          reservedQuantity,
        },
        update: { quantity, reservedQuantity },
      });
      return tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          warehouse: data.warehouse,
          type: data.type,
          quantity: data.quantity,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          notes: data.notes,
        },
      });
    });
  }

  async setMinStock(productId: number, warehouse: WarehouseType, minStockLevel: number) {
    return this.prisma.inventoryItem.upsert({
      where: { productId_warehouse: { productId, warehouse } },
      create: { productId, warehouse, minStockLevel },
      update: { minStockLevel },
    });
  }

  async getLowStockAlerts() {
    const items = await this.prisma.inventoryItem.findMany({
      include: { product: { select: { sku: true, name: true } } },
    });
    return items.filter(
      (item) =>
        item.minStockLevel !== null &&
        item.quantity - item.reservedQuantity <= item.minStockLevel,
    );
  }

  async getStats() {
    const items = await this.prisma.inventoryItem.findMany({
      include: {
        product: {
          select: { id: true, supplierProducts: { select: { costPrice: true } } },
        },
      },
    });

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => {
      const costPrice = item.product.supplierProducts[0]?.costPrice ?? 0;
      return sum + item.quantity * costPrice;
    }, 0);
    const totalProducts = new Set(items.map((item) => item.productId)).size;

    const warehouseMap = new Map<
      string,
      { warehouse: string; count: number; totalQuantity: number }
    >();
    for (const item of items) {
      const entry = warehouseMap.get(item.warehouse) ?? {
        warehouse: item.warehouse,
        count: 0,
        totalQuantity: 0,
      };
      entry.count += 1;
      entry.totalQuantity += item.quantity;
      warehouseMap.set(item.warehouse, entry);
    }
    const byWarehouse = Array.from(warehouseMap.values());

    const lowStockCount = items.filter(
      (item) =>
        item.minStockLevel !== null &&
        item.quantity - item.reservedQuantity <= item.minStockLevel,
    ).length;

    return { totalProducts, totalQuantity, totalValue, byWarehouse, lowStockCount };
  }
}

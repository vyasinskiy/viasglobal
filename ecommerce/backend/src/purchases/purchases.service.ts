import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PurchaseStatus } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    supplierId: number;
    orderNumber?: string;
    expectedDeliveryDate?: string | Date;
    shippingCost?: number;
    taxAmount?: number;
    notes?: string;
    items: Array<{
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }) {
    const shippingCost = data.shippingCost ?? 0;
    const taxAmount = data.taxAmount ?? 0;
    const itemsTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = itemsTotal + shippingCost + taxAmount;

    return this.prisma.purchase.create({
      data: {
        supplierId: data.supplierId,
        orderNumber: data.orderNumber,
        expectedDeliveryDate: data.expectedDeliveryDate
          ? new Date(data.expectedDeliveryDate)
          : undefined,
        shippingCost,
        taxAmount,
        totalAmount,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAll(
    status?: PurchaseStatus,
    supplierId?: number,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: Prisma.PurchaseWhereInput = {};
    if (status) {
      where.status = status;
    }
    if (supplierId) {
      where.supplierId = supplierId;
    }
    if (fromDate || toDate) {
      const orderDate: Prisma.DateTimeFilter = {};
      if (fromDate) {
        orderDate.gte = new Date(fromDate);
      }
      if (toDate) {
        orderDate.lte = new Date(toDate);
      }
      where.orderDate = orderDate;
    }

    return this.prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
          },
        },
        supplier: { select: { id: true, name: true } },
        documents: true,
      },
    });
  }

  async updateStatus(
    id: number,
    data: { status: PurchaseStatus; notes?: string },
  ) {
    const updateData: Prisma.PurchaseUpdateInput = { status: data.status };
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.status === 'RECEIVED') {
      updateData.actualDeliveryDate = new Date();
    }

    const purchase = await this.prisma.purchase.update({
      where: { id },
      data: updateData,
    });

    if (data.status === 'RECEIVED') {
      const items = await this.prisma.purchaseItem.findMany({
        where: { purchaseId: id },
      });
      await Promise.all(
        items.map((item) =>
          this.prisma.purchaseItem.update({
            where: { id: item.id },
            data: { receivedQuantity: item.quantity },
          }),
        ),
      );
    }

    return purchase;
  }

  async update(
    id: number,
    data: {
      orderNumber?: string;
      expectedDeliveryDate?: string | Date;
      shippingCost?: number;
      taxAmount?: number;
      notes?: string;
    },
  ) {
    const updateData: Prisma.PurchaseUpdateInput = {};
    if (data.orderNumber !== undefined) {
      updateData.orderNumber = data.orderNumber;
    }
    if (data.expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = data.expectedDeliveryDate
        ? new Date(data.expectedDeliveryDate)
        : null;
    }
    if (data.shippingCost !== undefined) {
      updateData.shippingCost = data.shippingCost;
    }
    if (data.taxAmount !== undefined) {
      updateData.taxAmount = data.taxAmount;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    await this.prisma.purchase.update({ where: { id }, data: updateData });

    if (data.shippingCost !== undefined || data.taxAmount !== undefined) {
      await this.recalculateTotalAmount(id);
    }

    return this.prisma.purchase.findUnique({ where: { id } });
  }

  async addItem(
    purchaseId: number,
    data: {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    },
  ) {
    const item = await this.prisma.purchaseItem.create({
      data: {
        purchaseId,
        productId: data.productId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
      },
    });
    await this.recalculateTotalAmount(purchaseId);
    return item;
  }

  async updateItem(
    itemId: number,
    data: { quantity?: number; unitPrice?: number; totalPrice?: number },
  ) {
    const item = await this.prisma.purchaseItem.update({
      where: { id: itemId },
      data,
    });
    await this.recalculateTotalAmount(item.purchaseId);
    return item;
  }

  async removeItem(itemId: number) {
    const item = await this.prisma.purchaseItem.delete({
      where: { id: itemId },
    });
    await this.recalculateTotalAmount(item.purchaseId);
    return item;
  }

  async receiveItem(itemId: number, quantity: number) {
    const item = await this.prisma.purchaseItem.update({
      where: { id: itemId },
      data: { receivedQuantity: { increment: quantity } },
    });

    const purchase = await this.prisma.purchase.findUnique({
      where: { id: item.purchaseId },
      include: { items: true },
    });

    if (purchase) {
      const fullyReceived = purchase.items.every(
        (i) => i.receivedQuantity >= i.quantity,
      );
      if (fullyReceived) {
        await this.prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: 'RECEIVED', actualDeliveryDate: new Date() },
        });
      }
    }

    return this.findById(item.purchaseId);
  }

  async getStats() {
    const [totalPurchases, totalSpent, byStatus, recentPurchases] =
      await Promise.all([
        this.prisma.purchase.count(),
        this.prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
        this.prisma.purchase.groupBy({
          by: ['status'],
          _count: { status: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.purchase.findMany({
          take: 5,
          orderBy: { orderDate: 'desc' },
          include: { supplier: { select: { id: true, name: true } } },
        }),
      ]);

    return {
      totalPurchases,
      totalSpent: totalSpent._sum.totalAmount ?? 0,
      byStatus: byStatus.map((entry) => ({
        status: entry.status,
        count: entry._count.status,
        amount: entry._sum.totalAmount ?? 0,
      })),
      recentPurchases,
    };
  }

  private async recalculateTotalAmount(purchaseId: number) {
    const purchase = await this.prisma.purchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) {
      return;
    }
    const items = await this.prisma.purchaseItem.findMany({
      where: { purchaseId },
    });
    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = itemsTotal + purchase.shippingCost + purchase.taxAmount;
    await this.prisma.purchase.update({
      where: { id: purchaseId },
      data: { totalAmount },
    });
  }
}

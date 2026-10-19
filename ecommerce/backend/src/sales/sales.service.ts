import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private async recalculateTotals(salesOrderId: number) {
    const items = await this.prisma.salesOrderItem.findMany({
      where: { salesOrderId },
    });

    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const platformFees = items.reduce((sum, i) => sum + i.platformFee, 0);

    const order = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
    });
    const shippingCost = order?.shippingCost ?? 0;
    const netAmount = totalAmount - platformFees - shippingCost;

    return this.prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { totalAmount, platformFees, netAmount },
    });
  }

  async create(data: {
    platformId: number;
    platformOrderId: string;
    orderDate?: string;
    shipDate?: string;
    status?: any;
    shippingCost?: number;
    customerInfo?: any;
    notes?: string;
    items: {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      platformFee?: number;
      costPrice?: number;
    }[];
  }) {
    const { items, ...orderData } = data;

    const order = await this.prisma.salesOrder.create({
      data: {
        ...orderData,
        orderDate: orderData.orderDate ? new Date(orderData.orderDate) : undefined,
        shipDate: orderData.shipDate ? new Date(orderData.shipDate) : undefined,
        items: {
          create: items,
        },
      },
      include: { items: true },
    });

    const updated = await this.recalculateTotals(order.id);
    return this.prisma.salesOrder.findUnique({
      where: { id: order.id },
      include: {
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        platform: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findAll(platformId?: number, status?: string, fromDate?: string, toDate?: string) {
    const where: any = {};
    if (platformId) where.platformId = platformId;
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate);
      if (toDate) where.orderDate.lte = new Date(toDate);
    }

    return this.prisma.salesOrder.findMany({
      where,
      include: {
        platform: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        platform: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async update(
    id: number,
    data: {
      shipDate?: string;
      deliveryDate?: string;
      status?: string;
      shippingCost?: number;
      notes?: string;
    },
  ) {
    const updateData: any = { ...data };

    if (data.shipDate) updateData.shipDate = new Date(data.shipDate);
    if (data.deliveryDate) updateData.deliveryDate = new Date(data.deliveryDate);
    if (data.status === 'DELIVERED') {
      updateData.deliveryDate = new Date();
    }

    await this.prisma.salesOrder.update({
      where: { id },
      data: updateData,
    });

    if (data.shippingCost !== undefined) {
      await this.recalculateTotals(id);
    }

    return this.findById(id);
  }

  async addItem(
    salesOrderId: number,
    data: {
      productId: number;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      platformFee?: number;
      costPrice?: number;
    },
  ) {
    await this.prisma.salesOrderItem.create({
      data: { salesOrderId, ...data },
    });
    await this.recalculateTotals(salesOrderId);
    return this.findById(salesOrderId);
  }

  async updateItem(
    itemId: number,
    data: {
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      platformFee?: number;
      costPrice?: number;
    },
  ) {
    const item = await this.prisma.salesOrderItem.update({
      where: { id: itemId },
      data,
    });
    await this.recalculateTotals(item.salesOrderId);
    return this.findById(item.salesOrderId);
  }

  async removeItem(itemId: number) {
    const item = await this.prisma.salesOrderItem.delete({
      where: { id: itemId },
    });
    await this.recalculateTotals(item.salesOrderId);
    return this.findById(item.salesOrderId);
  }

  async getStats(fromDate?: string, toDate?: string) {
    const where: any = {};
    if (fromDate || toDate) {
      where.orderDate = {};
      if (fromDate) where.orderDate.gte = new Date(fromDate);
      if (toDate) where.orderDate.lte = new Date(toDate);
    }

    const orders = await this.prisma.salesOrder.findMany({
      where,
      select: {
        totalAmount: true,
        platformFees: true,
        netAmount: true,
        platform: { select: { name: true } },
        status: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalPlatformFees = orders.reduce((sum, o) => sum + o.platformFees, 0);
    const totalNet = orders.reduce((sum, o) => sum + o.netAmount, 0);

    const byPlatformMap: Record<string, { count: number; revenue: number }> = {};
    const byStatusMap: Record<string, number> = {};

    for (const o of orders) {
      const pn = o.platform.name;
      if (!byPlatformMap[pn]) byPlatformMap[pn] = { count: 0, revenue: 0 };
      byPlatformMap[pn].count++;
      byPlatformMap[pn].revenue += o.totalAmount;

      const s = o.status;
      byStatusMap[s] = (byStatusMap[s] || 0) + 1;
    }

    return {
      totalOrders,
      totalRevenue,
      totalPlatformFees,
      totalNet,
      byPlatform: Object.entries(byPlatformMap).map(([platformName, data]) => ({
        platformName,
        ...data,
      })),
      byStatus: Object.entries(byStatusMap).map(([status, count]) => ({
        status,
        count,
      })),
    };
  }
}
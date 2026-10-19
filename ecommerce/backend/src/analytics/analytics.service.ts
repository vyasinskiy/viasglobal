import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalSuppliers,
        activeSuppliers,
        totalProducts,
        productsWithSupplier,
        purchasesAgg,
        pendingPurchases,
        salesAgg,
        inventoryAgg,
        inventoryByWarehouse,
        lowStockItems,
        recentCommunications,
        recentPurchases,
        recentSales,
        marginItems,
      ] = await Promise.all([
        this.prisma.supplier.count(),
        this.prisma.supplier.count({
          where: { status: { notIn: ['REJECTED', 'INACTIVE'] } },
        }),
        this.prisma.product.count(),
        this.prisma.product.count({
          where: { supplierProducts: { some: {} } },
        }),
        this.prisma.purchase.aggregate({
          where: { orderDate: { gte: startOfMonth } },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.purchase.count({
          where: { status: { in: ['DRAFT', 'SENT', 'CONFIRMED', 'PAID'] } },
        }),
        this.prisma.salesOrder.aggregate({
          where: { orderDate: { gte: startOfMonth } },
          _count: { id: true },
          _sum: { totalAmount: true, netAmount: true, platformFees: true },
        }),
        this.prisma.inventoryItem.aggregate({
          _sum: { quantity: true },
        }),
        this.prisma.inventoryItem.groupBy({
          by: ['warehouse'],
          _sum: { quantity: true },
        }),
        this.prisma.inventoryItem.findMany({
          where: { minStockLevel: { not: null } },
          select: { quantity: true, minStockLevel: true },
        }),
        this.prisma.supplierCommunication.findMany({
          orderBy: { date: 'desc' },
          take: 5,
          include: { supplier: { select: { id: true, name: true } } },
        }),
        this.prisma.purchase.findMany({
          orderBy: { orderDate: 'desc' },
          take: 5,
          include: { supplier: { select: { id: true, name: true } } },
        }),
        this.prisma.salesOrder.findMany({
          orderBy: { orderDate: 'desc' },
          take: 5,
        }),
        this.prisma.salesOrderItem.findMany({
          where: { costPrice: { not: null } },
          select: { totalPrice: true, costPrice: true },
        }),
      ]);

      const lowStockCount = lowStockItems.filter(
        (item) => item.quantity <= (item.minStockLevel ?? 0),
      ).length;

      let avgMarginPercent = 0;
      if (marginItems.length > 0) {
        const total = marginItems.reduce((sum, item) => {
          if (item.totalPrice > 0 && item.costPrice !== null) {
            return sum + ((item.totalPrice - item.costPrice) / item.totalPrice) * 100;
          }
          return sum;
        }, 0);
        avgMarginPercent = Math.round((total / marginItems.length) * 100) / 100;
      }

      return {
        suppliers: {
          total: totalSuppliers,
          active: activeSuppliers,
          inPipeline: activeSuppliers,
        },
        products: {
          total: totalProducts,
          withSupplier: productsWithSupplier,
        },
        purchases: {
          totalThisMonth: purchasesAgg._count.id,
          totalAmountThisMonth: purchasesAgg._sum.totalAmount ?? 0,
          pending: pendingPurchases,
        },
        sales: {
          totalThisMonth: salesAgg._count.id,
          totalRevenueThisMonth: salesAgg._sum.totalAmount ?? 0,
          totalNetThisMonth: salesAgg._sum.netAmount ?? 0,
          totalPlatformFeesThisMonth: salesAgg._sum.platformFees ?? 0,
        },
        inventory: {
          totalItems: inventoryAgg._sum.quantity ?? 0,
          lowStockCount,
          byWarehouse: inventoryByWarehouse.map((w) => ({
            warehouse: w.warehouse,
            count: w._sum.quantity ?? 0,
          })),
        },
        recentActivity: {
          communications: recentCommunications,
          purchases: recentPurchases,
          sales: recentSales,
        },
        margin: {
          avgMarginPercent,
        },
      };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  async getMarginReport(fromDate?: string, toDate?: string, productId?: number) {
    try {
      const conditions: string[] = ['soi."costPrice" IS NOT NULL'];
      const params: any[] = [];

      if (fromDate) {
        params.push(fromDate);
        conditions.push(`so."orderDate" >= $${params.length}::date`);
      }
      if (toDate) {
        params.push(toDate);
        conditions.push(`so."orderDate" <= $${params.length}::date`);
      }
      if (productId) {
        params.push(productId);
        conditions.push(`soi."productId" = $${params.length}::int`);
      }

      const query = `
        SELECT
          soi."productId",
          p.sku,
          p.name,
          SUM(soi.quantity)::int AS "totalSold",
          ROUND(SUM(soi."totalPrice")::numeric, 2) AS "totalRevenue",
          ROUND(SUM(soi."costPrice" * soi.quantity)::numeric, 2) AS "totalCost",
          ROUND(SUM(soi."totalPrice" - soi."costPrice" * soi.quantity)::numeric, 2) AS "grossProfit",
          ROUND(
            CASE
              WHEN SUM(soi."totalPrice") > 0 THEN
                SUM(soi."totalPrice" - soi."costPrice" * soi.quantity) / SUM(soi."totalPrice") * 100
              ELSE 0
            END,
            2
          ) AS "marginPercent"
        FROM "SalesOrderItem" soi
        JOIN "Product" p ON p.id = soi."productId"
        JOIN "SalesOrder" so ON so.id = soi."salesOrderId"
        WHERE ${conditions.join(' AND ')}
        GROUP BY soi."productId", p.sku, p.name
        ORDER BY "grossProfit" DESC
      `;

      return await this.prisma.$queryRawUnsafe(query, ...params);
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  async getSupplierPerformance() {
    try {
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT
          s.id AS "supplierId",
          s.name,
          COUNT(DISTINCT p.id)::int AS "totalPurchases",
          COALESCE(SUM(p."totalAmount"), 0)::float AS "totalSpent",
          COUNT(DISTINCT pi."productId")::int AS "totalProducts",
          ROUND(COALESCE(AVG(m."margin"), 0)::numeric, 2) AS "avgMargin"
        FROM "Supplier" s
        LEFT JOIN "Purchase" p ON p."supplierId" = s.id
        LEFT JOIN "PurchaseItem" pi ON pi."purchaseId" = p.id
        LEFT JOIN (
          SELECT
            soi."productId",
            (soi."totalPrice" - soi."costPrice" * soi.quantity) / NULLIF(soi."totalPrice", 0) * 100 AS margin
          FROM "SalesOrderItem" soi
          WHERE soi."costPrice" IS NOT NULL
        ) m ON m."productId" = pi."productId"
        GROUP BY s.id, s.name
        ORDER BY "totalSpent" DESC
      `);
      return result;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  async getSalesTrend(days: number = 30, platformId?: number) {
    try {
      let query = `
        SELECT
          DATE(so."orderDate")::text AS date,
          ROUND(SUM(so."totalAmount")::numeric, 2) AS revenue,
          COUNT(so.id)::int AS orders,
          ROUND(SUM(so."platformFees")::numeric, 2) AS fees
        FROM "SalesOrder" so
        WHERE so."orderDate" >= CURRENT_DATE - MAKE_INTERVAL(days => $1::int)
      `;

      const params: any[] = [days];

      if (platformId) {
        query += ` AND so."platformId" = $2::int`;
        params.push(platformId);
      }

      query += ` GROUP BY DATE(so."orderDate") ORDER BY date ASC`;

      return await this.prisma.$queryRawUnsafe(query, ...params);
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  async getInventoryTurnover() {
    try {
      const result = await this.prisma.$queryRawUnsafe(`
        SELECT
          ii."productId",
          p.sku,
          p.name,
          SUM(ii.quantity)::int AS "stockOnHand",
          COALESCE(soldData."totalSold", 0)::int AS "totalSoldLast30Days",
          ROUND(
            CASE
              WHEN SUM(ii.quantity) > 0 THEN
                COALESCE(soldData."totalSold", 0)::float / SUM(ii.quantity)
              ELSE 0
            END,
            2
          ) AS "turnoverRate"
        FROM "InventoryItem" ii
        JOIN "Product" p ON p.id = ii."productId"
        LEFT JOIN (
          SELECT
            soi."productId",
            SUM(soi.quantity) AS "totalSold"
          FROM "SalesOrderItem" soi
          JOIN "SalesOrder" so ON so.id = soi."salesOrderId"
          WHERE so."orderDate" >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY soi."productId"
        ) soldData ON soldData."productId" = ii."productId"
        GROUP BY ii."productId", p.sku, p.name, soldData."totalSold"
        HAVING SUM(ii.quantity) > 0
        ORDER BY "turnoverRate" DESC
      `);
      return result;
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }
}
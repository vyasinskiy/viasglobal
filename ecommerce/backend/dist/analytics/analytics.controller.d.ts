import { AnalyticsService } from './analytics.service.js';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
        suppliers: {
            total: number;
            active: number;
            inPipeline: number;
        };
        products: {
            total: number;
            withSupplier: number;
        };
        purchases: {
            totalThisMonth: number;
            totalAmountThisMonth: number;
            pending: number;
        };
        sales: {
            totalThisMonth: number;
            totalRevenueThisMonth: number;
            totalNetThisMonth: number;
            totalPlatformFeesThisMonth: number;
        };
        inventory: {
            totalItems: number;
            lowStockCount: number;
            byWarehouse: {
                warehouse: import("@prisma/client").$Enums.WarehouseType;
                count: number;
            }[];
        };
        recentActivity: {
            communications: ({
                supplier: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                createdAt: Date;
                date: Date;
                supplierId: number;
                type: import("@prisma/client").$Enums.CommunicationType;
                summary: string;
                nextAction: string | null;
                nextActionDate: Date | null;
            })[];
            purchases: ({
                supplier: {
                    id: number;
                    name: string;
                };
            } & {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.PurchaseStatus;
                notes: string | null;
                supplierId: number;
                currency: string;
                orderNumber: string | null;
                orderDate: Date;
                expectedDeliveryDate: Date | null;
                actualDeliveryDate: Date | null;
                shippingCost: number;
                taxAmount: number;
                totalAmount: number;
            })[];
            sales: {
                id: number;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.SalesOrderStatus;
                notes: string | null;
                currency: string;
                orderDate: Date;
                shippingCost: number;
                totalAmount: number;
                platformId: number;
                platformOrderId: string;
                shipDate: Date | null;
                deliveryDate: Date | null;
                platformFees: number;
                netAmount: number;
                customerInfo: import("@prisma/client/runtime/client").JsonValue | null;
            }[];
        };
        margin: {
            avgMarginPercent: number;
        };
        status?: undefined;
        message?: undefined;
    } | {
        status: string;
        message: any;
        suppliers?: undefined;
        products?: undefined;
        purchases?: undefined;
        sales?: undefined;
        inventory?: undefined;
        recentActivity?: undefined;
        margin?: undefined;
    }>;
    getMarginReport(fromDate?: string, toDate?: string, productId?: any): Promise<unknown>;
    getSupplierPerformance(): Promise<unknown>;
    getSalesTrend(days?: any, platformId?: any): Promise<unknown>;
    getInventoryTurnover(): Promise<unknown>;
}

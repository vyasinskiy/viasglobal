import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(body: any): Promise<({
        platform: {
            id: number;
            name: string;
            code: string;
        };
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            costPrice: number | null;
            productId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            salesOrderId: number;
            platformFee: number;
        })[];
    } & {
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
    }) | null>;
    getStats(fromDate?: string, toDate?: string): Promise<{
        totalOrders: number;
        totalRevenue: number;
        totalPlatformFees: number;
        totalNet: number;
        byPlatform: {
            count: number;
            revenue: number;
            platformName: string;
        }[];
        byStatus: {
            status: string;
            count: number;
        }[];
    }>;
    findAll(platformId?: string, status?: string, fromDate?: string, toDate?: string): Promise<({
        platform: {
            name: string;
        };
        _count: {
            items: number;
        };
    } & {
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
    })[]>;
    findById(id: number): Promise<({
        platform: {
            id: number;
            name: string;
            code: string;
        };
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            costPrice: number | null;
            productId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            salesOrderId: number;
            platformFee: number;
        })[];
    } & {
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
    }) | null>;
    update(id: number, body: any): Promise<({
        platform: {
            id: number;
            name: string;
            code: string;
        };
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            costPrice: number | null;
            productId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            salesOrderId: number;
            platformFee: number;
        })[];
    } & {
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
    }) | null>;
    addItem(id: number, body: any): Promise<({
        platform: {
            id: number;
            name: string;
            code: string;
        };
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            costPrice: number | null;
            productId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            salesOrderId: number;
            platformFee: number;
        })[];
    } & {
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
    }) | null>;
    updateItem(itemId: number, body: any): Promise<({
        platform: {
            id: number;
            name: string;
            code: string;
        };
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            costPrice: number | null;
            productId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            salesOrderId: number;
            platformFee: number;
        })[];
    } & {
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
    }) | null>;
    removeItem(itemId: number): Promise<({
        platform: {
            id: number;
            name: string;
            code: string;
        };
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            costPrice: number | null;
            productId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            salesOrderId: number;
            platformFee: number;
        })[];
    } & {
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
    }) | null>;
}

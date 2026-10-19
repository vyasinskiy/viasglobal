import { PrismaService } from '../prisma/prisma.service';
import { PurchaseStatus } from '@prisma/client';
export declare class PurchasesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
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
    }): Promise<{
        items: {
            id: number;
            productId: number;
            purchaseId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            receivedQuantity: number;
        }[];
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
    }>;
    findAll(status?: PurchaseStatus, supplierId?: number, fromDate?: string, toDate?: string): Promise<({
        supplier: {
            id: number;
            name: string;
        };
        _count: {
            items: number;
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
    })[]>;
    findById(id: number): Promise<({
        supplier: {
            id: number;
            name: string;
        };
        documents: {
            id: number;
            notes: string | null;
            supplierId: number | null;
            productId: number | null;
            entityType: import("@prisma/client").$Enums.EntityType;
            entityId: number;
            documentType: import("@prisma/client").$Enums.DocumentType;
            fileName: string;
            filePath: string;
            fileSize: number | null;
            mimeType: string | null;
            uploadedAt: Date;
            purchaseId: number | null;
            saleId: number | null;
        }[];
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            productId: number;
            purchaseId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            receivedQuantity: number;
        })[];
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
    }) | null>;
    updateStatus(id: number, data: {
        status: PurchaseStatus;
        notes?: string;
    }): Promise<{
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
    }>;
    update(id: number, data: {
        orderNumber?: string;
        expectedDeliveryDate?: string | Date;
        shippingCost?: number;
        taxAmount?: number;
        notes?: string;
    }): Promise<{
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
    } | null>;
    addItem(purchaseId: number, data: {
        productId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }): Promise<{
        id: number;
        productId: number;
        purchaseId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
    updateItem(itemId: number, data: {
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
    }): Promise<{
        id: number;
        productId: number;
        purchaseId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
    removeItem(itemId: number): Promise<{
        id: number;
        productId: number;
        purchaseId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
    receiveItem(itemId: number, quantity: number): Promise<({
        supplier: {
            id: number;
            name: string;
        };
        documents: {
            id: number;
            notes: string | null;
            supplierId: number | null;
            productId: number | null;
            entityType: import("@prisma/client").$Enums.EntityType;
            entityId: number;
            documentType: import("@prisma/client").$Enums.DocumentType;
            fileName: string;
            filePath: string;
            fileSize: number | null;
            mimeType: string | null;
            uploadedAt: Date;
            purchaseId: number | null;
            saleId: number | null;
        }[];
        items: ({
            product: {
                id: number;
                name: string;
                sku: string;
            };
        } & {
            id: number;
            productId: number;
            purchaseId: number;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            receivedQuantity: number;
        })[];
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
    }) | null>;
    getStats(): Promise<{
        totalPurchases: number;
        totalSpent: number;
        byStatus: {
            status: import("@prisma/client").$Enums.PurchaseStatus;
            count: number;
            amount: number;
        }[];
        recentPurchases: ({
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
    }>;
    private recalculateTotalAmount;
}

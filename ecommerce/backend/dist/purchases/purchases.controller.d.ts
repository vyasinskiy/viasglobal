import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private readonly purchasesService;
    constructor(purchasesService: PurchasesService);
    create(body: any): Promise<{
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
    findAll(query: any): Promise<({
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
    update(id: number, body: any): Promise<{
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
    updateStatus(id: number, body: any): Promise<{
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
    addItem(id: number, body: any): Promise<{
        id: number;
        productId: number;
        purchaseId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
    updateItem(itemId: number, body: any): Promise<{
        id: number;
        productId: number;
        purchaseId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
    receiveItem(itemId: number, body: any): Promise<({
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
    removeItem(itemId: number): Promise<{
        id: number;
        productId: number;
        purchaseId: number;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        receivedQuantity: number;
    }>;
}

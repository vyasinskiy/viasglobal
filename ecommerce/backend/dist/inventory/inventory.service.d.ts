import { PrismaService } from '../prisma/prisma.service';
import { MovementType, WarehouseType } from '@prisma/client';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(warehouse?: WarehouseType, lowStock?: boolean): Promise<({
        product: {
            name: string;
            sku: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        reservedQuantity: number;
        minStockLevel: number | null;
    })[]>;
    findByProduct(productId: number): Promise<({
        product: {
            name: string;
            sku: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        reservedQuantity: number;
        minStockLevel: number | null;
    })[]>;
    getMovements(productId?: number, warehouse?: string, type?: string, fromDate?: string, toDate?: string, limit?: number): Promise<({
        product: {
            name: string;
        };
    } & {
        id: number;
        notes: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.MovementType;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        referenceType: string | null;
        referenceId: number | null;
    })[]>;
    adjust(productId: number, data: {
        warehouse: WarehouseType;
        quantity: number;
        notes?: string;
    }): Promise<{
        id: number;
        notes: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.MovementType;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        referenceType: string | null;
        referenceId: number | null;
    }>;
    move(data: {
        productId: number;
        warehouse: WarehouseType;
        type: MovementType;
        quantity: number;
        referenceType?: string;
        referenceId?: number;
        notes?: string;
    }): Promise<{
        id: number;
        notes: string | null;
        date: Date;
        type: import("@prisma/client").$Enums.MovementType;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        referenceType: string | null;
        referenceId: number | null;
    }>;
    setMinStock(productId: number, warehouse: WarehouseType, minStockLevel: number): Promise<{
        id: number;
        updatedAt: Date;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        reservedQuantity: number;
        minStockLevel: number | null;
    }>;
    getLowStockAlerts(): Promise<({
        product: {
            name: string;
            sku: string;
        };
    } & {
        id: number;
        updatedAt: Date;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        reservedQuantity: number;
        minStockLevel: number | null;
    })[]>;
    getStats(): Promise<{
        totalProducts: number;
        totalQuantity: number;
        totalValue: number;
        byWarehouse: {
            warehouse: string;
            count: number;
            totalQuantity: number;
        }[];
        lowStockCount: number;
    }>;
}

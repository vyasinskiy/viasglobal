import { InventoryService } from './inventory.service';
import { WarehouseType } from '@prisma/client';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    findAll(warehouse?: WarehouseType, lowStock?: string): Promise<({
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
    getMovements(productId?: string, warehouse?: string, type?: string, fromDate?: string, toDate?: string, limit?: string): Promise<({
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
    adjust(body: any): Promise<{
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
    move(body: any): Promise<{
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
    setMinStock(productId: number, body: any): Promise<{
        id: number;
        updatedAt: Date;
        productId: number;
        warehouse: import("@prisma/client").$Enums.WarehouseType;
        quantity: number;
        reservedQuantity: number;
        minStockLevel: number | null;
    }>;
}

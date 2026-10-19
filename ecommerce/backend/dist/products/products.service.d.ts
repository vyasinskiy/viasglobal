import { PrismaService } from '../prisma/prisma.service';
export declare class ProductsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(data: {
        sku: string;
        name: string;
        description?: string;
        brand?: string;
        manufacturer?: string;
        category?: string;
        imageUrl?: string;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        description: string | null;
        brand: string | null;
        manufacturer: string | null;
        category: string | null;
        imageUrl: string | null;
    }>;
    findAll(search?: string, brand?: string, category?: string): Promise<({
        _count: {
            supplierProducts: number;
        };
        externalIds: ({
            platform: {
                id: number;
                name: string;
                createdAt: Date;
                code: string;
            };
        } & {
            id: number;
            createdAt: Date;
            productId: number;
            platformId: number;
            externalId: string;
        })[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        description: string | null;
        brand: string | null;
        manufacturer: string | null;
        category: string | null;
        imageUrl: string | null;
    })[]>;
    findById(id: number): Promise<{
        salesCount: number;
        _count: undefined;
        supplierProducts: ({
            supplier: {
                id: number;
                email: string | null;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                status: import("@prisma/client").$Enums.SupplierStatus;
                website: string | null;
                country: string | null;
                phone: string | null;
                rejectionReason: string | null;
                notes: string | null;
                lastContactAt: Date | null;
            };
        } & {
            id: number;
            createdAt: Date;
            supplierId: number;
            supplierSku: string | null;
            costPrice: number;
            currency: string;
            taxRate: number;
            unitsPerBox: number | null;
            minOrderQty: number | null;
            validFrom: Date;
            validTo: Date | null;
            productId: number;
        })[];
        externalIds: ({
            platform: {
                id: number;
                name: string;
                createdAt: Date;
                code: string;
            };
        } & {
            id: number;
            createdAt: Date;
            productId: number;
            platformId: number;
            externalId: string;
        })[];
        inventoryItems: {
            id: number;
            updatedAt: Date;
            productId: number;
            warehouse: import("@prisma/client").$Enums.WarehouseType;
            quantity: number;
            reservedQuantity: number;
            minStockLevel: number | null;
        }[];
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        description: string | null;
        brand: string | null;
        manufacturer: string | null;
        category: string | null;
        imageUrl: string | null;
    } | null>;
    update(id: number, data: {
        name?: string;
        description?: string;
        brand?: string;
        manufacturer?: string;
        category?: string;
        imageUrl?: string;
    }): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        description: string | null;
        brand: string | null;
        manufacturer: string | null;
        category: string | null;
        imageUrl: string | null;
    }>;
    remove(id: number): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        description: string | null;
        brand: string | null;
        manufacturer: string | null;
        category: string | null;
        imageUrl: string | null;
    }>;
    addExternalId(productId: number, data: {
        platformId: number;
        externalId: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        productId: number;
        platformId: number;
        externalId: string;
    }>;
    removeExternalId(id: number): Promise<{
        id: number;
        createdAt: Date;
        productId: number;
        platformId: number;
        externalId: string;
    }>;
    addSupplierPrice(data: {
        supplierId: number;
        productId: number;
        costPrice: number;
        supplierSku?: string;
        unitsPerBox?: number;
        minOrderQty?: number;
        validFrom?: string;
        validTo?: string;
    }): Promise<{
        id: number;
        createdAt: Date;
        supplierId: number;
        supplierSku: string | null;
        costPrice: number;
        currency: string;
        taxRate: number;
        unitsPerBox: number | null;
        minOrderQty: number | null;
        validFrom: Date;
        validTo: Date | null;
        productId: number;
    }>;
    removeSupplierPrice(id: number): Promise<{
        id: number;
        createdAt: Date;
        supplierId: number;
        supplierSku: string | null;
        costPrice: number;
        currency: string;
        taxRate: number;
        unitsPerBox: number | null;
        minOrderQty: number | null;
        validFrom: Date;
        validTo: Date | null;
        productId: number;
    }>;
    getPlatforms(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        code: string;
    }[]>;
}

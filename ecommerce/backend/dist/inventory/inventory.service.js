"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(warehouse, lowStock) {
        const where = {};
        if (warehouse) {
            where.warehouse = warehouse;
        }
        const items = await this.prisma.inventoryItem.findMany({
            where,
            include: { product: { select: { sku: true, name: true } } },
            orderBy: { product: { name: 'asc' } },
        });
        if (lowStock) {
            return items.filter((item) => item.minStockLevel !== null &&
                item.quantity - item.reservedQuantity <= item.minStockLevel);
        }
        return items;
    }
    async findByProduct(productId) {
        return this.prisma.inventoryItem.findMany({
            where: { productId },
            include: { product: { select: { sku: true, name: true } } },
            orderBy: { warehouse: 'asc' },
        });
    }
    async getMovements(productId, warehouse, type, fromDate, toDate, limit) {
        const where = {};
        if (productId) {
            where.productId = productId;
        }
        if (warehouse) {
            where.warehouse = warehouse;
        }
        if (type) {
            where.type = type;
        }
        if (fromDate || toDate) {
            where.date = {};
            if (fromDate) {
                where.date.gte = new Date(fromDate);
            }
            if (toDate) {
                where.date.lte = new Date(toDate);
            }
        }
        return this.prisma.inventoryMovement.findMany({
            where,
            include: { product: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: limit,
        });
    }
    async adjust(productId, data) {
        const existing = await this.prisma.inventoryItem.findUnique({
            where: { productId_warehouse: { productId, warehouse: data.warehouse } },
        });
        const delta = data.quantity - (existing?.quantity ?? 0);
        return this.prisma.$transaction(async (tx) => {
            await tx.inventoryItem.upsert({
                where: { productId_warehouse: { productId, warehouse: data.warehouse } },
                create: { productId, warehouse: data.warehouse, quantity: data.quantity },
                update: { quantity: data.quantity },
            });
            return tx.inventoryMovement.create({
                data: {
                    productId,
                    warehouse: data.warehouse,
                    type: 'ADJUST',
                    quantity: delta,
                    notes: data.notes,
                },
            });
        });
    }
    async move(data) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { productId_warehouse: { productId: data.productId, warehouse: data.warehouse } },
        });
        const currentQuantity = item?.quantity ?? 0;
        const currentReserved = item?.reservedQuantity ?? 0;
        let quantity = currentQuantity;
        let reservedQuantity = currentReserved;
        switch (data.type) {
            case 'IN':
            case 'RETURN':
                quantity += data.quantity;
                break;
            case 'OUT':
                if (currentQuantity - data.quantity < 0) {
                    throw new common_1.BadRequestException('Insufficient quantity in stock');
                }
                quantity -= data.quantity;
                break;
            case 'RESERVE':
                reservedQuantity += data.quantity;
                break;
            case 'UNRESERVE':
                if (currentReserved - data.quantity < 0) {
                    throw new common_1.BadRequestException('Insufficient reserved quantity');
                }
                reservedQuantity -= data.quantity;
                break;
            case 'ADJUST':
                quantity = data.quantity;
                break;
            default:
                throw new common_1.BadRequestException('Invalid movement type');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.inventoryItem.upsert({
                where: {
                    productId_warehouse: { productId: data.productId, warehouse: data.warehouse },
                },
                create: {
                    productId: data.productId,
                    warehouse: data.warehouse,
                    quantity,
                    reservedQuantity,
                },
                update: { quantity, reservedQuantity },
            });
            return tx.inventoryMovement.create({
                data: {
                    productId: data.productId,
                    warehouse: data.warehouse,
                    type: data.type,
                    quantity: data.quantity,
                    referenceType: data.referenceType,
                    referenceId: data.referenceId,
                    notes: data.notes,
                },
            });
        });
    }
    async setMinStock(productId, warehouse, minStockLevel) {
        return this.prisma.inventoryItem.upsert({
            where: { productId_warehouse: { productId, warehouse } },
            create: { productId, warehouse, minStockLevel },
            update: { minStockLevel },
        });
    }
    async getLowStockAlerts() {
        const items = await this.prisma.inventoryItem.findMany({
            include: { product: { select: { sku: true, name: true } } },
        });
        return items.filter((item) => item.minStockLevel !== null &&
            item.quantity - item.reservedQuantity <= item.minStockLevel);
    }
    async getStats() {
        const items = await this.prisma.inventoryItem.findMany({
            include: {
                product: {
                    select: { id: true, supplierProducts: { select: { costPrice: true } } },
                },
            },
        });
        const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = items.reduce((sum, item) => {
            const costPrice = item.product.supplierProducts[0]?.costPrice ?? 0;
            return sum + item.quantity * costPrice;
        }, 0);
        const totalProducts = new Set(items.map((item) => item.productId)).size;
        const warehouseMap = new Map();
        for (const item of items) {
            const entry = warehouseMap.get(item.warehouse) ?? {
                warehouse: item.warehouse,
                count: 0,
                totalQuantity: 0,
            };
            entry.count += 1;
            entry.totalQuantity += item.quantity;
            warehouseMap.set(item.warehouse, entry);
        }
        const byWarehouse = Array.from(warehouseMap.values());
        const lowStockCount = items.filter((item) => item.minStockLevel !== null &&
            item.quantity - item.reservedQuantity <= item.minStockLevel).length;
        return { totalProducts, totalQuantity, totalValue, byWarehouse, lowStockCount };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map
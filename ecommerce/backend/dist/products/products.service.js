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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.product.create({ data });
    }
    async findAll(search, brand, category) {
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }
        if (category) {
            where.category = { contains: category, mode: 'insensitive' };
        }
        return this.prisma.product.findMany({
            where,
            include: {
                externalIds: { include: { platform: true } },
                _count: { select: { supplierProducts: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                externalIds: { include: { platform: true } },
                supplierProducts: { include: { supplier: true } },
                inventoryItems: true,
                _count: { select: { salesItems: true } },
            },
        });
        if (!product)
            return null;
        return {
            ...product,
            salesCount: product._count.salesItems,
            _count: undefined,
        };
    }
    async update(id, data) {
        return this.prisma.product.update({ where: { id }, data });
    }
    async remove(id) {
        return this.prisma.product.delete({ where: { id } });
    }
    async addExternalId(productId, data) {
        return this.prisma.productExternalId.create({
            data: { productId, ...data },
        });
    }
    async removeExternalId(id) {
        return this.prisma.productExternalId.delete({ where: { id } });
    }
    async addSupplierPrice(data) {
        const { supplierId, productId, costPrice, supplierSku, unitsPerBox, minOrderQty, validFrom, validTo } = data;
        return this.prisma.supplierProduct.upsert({
            where: { supplierId_productId: { supplierId, productId } },
            create: {
                supplierId,
                productId,
                costPrice,
                supplierSku,
                unitsPerBox,
                minOrderQty,
                validFrom: validFrom ? new Date(validFrom) : undefined,
                validTo: validTo ? new Date(validTo) : undefined,
            },
            update: {
                costPrice,
                supplierSku,
                unitsPerBox,
                minOrderQty,
                validFrom: validFrom ? new Date(validFrom) : undefined,
                validTo: validTo ? new Date(validTo) : undefined,
            },
        });
    }
    async removeSupplierPrice(id) {
        return this.prisma.supplierProduct.delete({ where: { id } });
    }
    async getPlatforms() {
        return this.prisma.platform.findMany({ orderBy: { name: 'asc' } });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map
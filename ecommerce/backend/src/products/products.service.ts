import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    sku: string;
    name: string;
    description?: string;
    brand?: string;
    manufacturer?: string;
    category?: string;
    imageUrl?: string;
  }) {
    return this.prisma.product.create({ data });
  }

  async findAll(search?: string, brand?: string, category?: string) {
    const where: any = {};
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

  async findById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        externalIds: { include: { platform: true } },
        supplierProducts: { include: { supplier: true } },
        inventoryItems: true,
        _count: { select: { salesItems: true } },
      },
    });
    if (!product) return null;
    return {
      ...product,
      salesCount: product._count.salesItems,
      _count: undefined,
    };
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      brand?: string;
      manufacturer?: string;
      category?: string;
      imageUrl?: string;
    },
  ) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }

  async addExternalId(productId: number, data: { platformId: number; externalId: string }) {
    return this.prisma.productExternalId.create({
      data: { productId, ...data },
    });
  }

  async removeExternalId(id: number) {
    return this.prisma.productExternalId.delete({ where: { id } });
  }

  async addSupplierPrice(data: {
    supplierId: number;
    productId: number;
    costPrice: number;
    supplierSku?: string;
    unitsPerBox?: number;
    minOrderQty?: number;
    validFrom?: string;
    validTo?: string;
  }) {
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

  async removeSupplierPrice(id: number) {
    return this.prisma.supplierProduct.delete({ where: { id } });
  }

  async getPlatforms() {
    return this.prisma.platform.findMany({ orderBy: { name: 'asc' } });
  }
}
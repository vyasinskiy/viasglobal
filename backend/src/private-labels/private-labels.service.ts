import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivateLabelsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверяет, является ли связка Бренд + Продавец приватным лейблом
   */
  async checkPrivateLabel(brandName: string, sellerId: string) {
    if (!brandName || !sellerId) {
      return { isPrivateLabel: false };
    }
    const record = await this.prisma.privateLabel.findFirst({
      where: {
        brand: { name: { equals: brandName, mode: 'insensitive' } },
        sellerId: sellerId,
      },
    });
    return { isPrivateLabel: !!record };
  }

  /**
   * Добавляет связку Бренд + Продавец (Private Label)
   */
  async addPrivateLabel(brandName: string, sellerId: string, sellerName?: string) {
    // 1. Добавляем или обновляем Продавца (Seller)
    const seller = await this.prisma.seller.upsert({
      where: { id: sellerId },
      update: { name: sellerName || sellerId },
      create: { id: sellerId, name: sellerName || sellerId },
    });

    // 2. Добавляем или находим бренд (Brand)
    const brand = await this.prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });

    // 3. Создаем или обновляем запись PrivateLabel
    const privateLabel = await this.prisma.privateLabel.upsert({
      where: {
        brandId_sellerId: {
          brandId: brand.id,
          sellerId: seller.id,
        },
      },
      update: {},
      create: {
        brandId: brand.id,
        sellerId: seller.id,
      },
    });

    return privateLabel;
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrivateLabelsService {
  constructor(private prisma: PrismaService) { }

  async checkPrivateLabel(brandName: string, manufacturerName: string) {
    if (!brandName || !manufacturerName) {
      return { isPrivateLabel: false };
    }
    const record = await this.prisma.privateLabel.findFirst({
      where: {
        brand: { name: { equals: brandName, mode: 'insensitive' } },
        manufacturer: { name: { equals: manufacturerName, mode: 'insensitive' } }
      }
    });
    return { isPrivateLabel: !!record };
  }

  async addPrivateLabel(brandName: string, manufacturerName: string) {
    // 1. Upsert Manufacturer
    const manufacturer = await this.prisma.manufacturer.upsert({
      where: { name: manufacturerName },
      update: { isAnalyzed: true },
      create: { name: manufacturerName, isAnalyzed: true }
    });

    // 2. Upsert Brand
    const brand = await this.prisma.brand.upsert({
      where: { name: brandName },
      update: { isAnalyzed: true },
      create: { name: brandName, isAnalyzed: true }
    });

    // 3. Upsert PrivateLabel relation
    const privateLabel = await this.prisma.privateLabel.upsert({
      where: {
        brandId_manufacturerId: {
          brandId: brand.id,
          manufacturerId: manufacturer.id
        }
      },
      update: {},
      create: {
        brandId: brand.id,
        manufacturerId: manufacturer.id
      }
    });

    return privateLabel;
  }
}

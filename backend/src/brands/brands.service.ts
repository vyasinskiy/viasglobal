import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async checkBrandAnalyzed(name: string): Promise<boolean> {
    let brand = await this.prisma.brand.findUnique({ where: { name } });
    if (!brand) {
      brand = await this.prisma.brand.create({ data: { name, isAnalyzed: false } });
    }
    return brand.isAnalyzed;
  }
  
  async markAsAnalyzed(name: string) {
    return this.prisma.brand.upsert({
      where: { name },
      update: { isAnalyzed: true },
      create: { name, isAnalyzed: true },
    });
  }
}

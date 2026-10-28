import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверяет наличие бренда в базе данных или создает его при отсутствии
   */
  async findOrCreate(name: string) {
    const normalized = name.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '').trim().toUpperCase();
    let brand = await this.prisma.brand.findUnique({ where: { name: normalized } });
    if (!brand) {
      brand = await this.prisma.brand.create({ data: { name: normalized } });
    }
    return brand;
  }
  
  /**
   * Находит бренд по имени
   */
  async findByName(name: string) {
    const normalized = name.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '').trim().toUpperCase();
    return this.prisma.brand.findUnique({
      where: { name: normalized },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Проверяет наличие бренда в базе данных или создает его при отсутствии
   */
  async findOrCreate(name: string) {
    let brand = await this.prisma.brand.findUnique({ where: { name } });
    if (!brand) {
      brand = await this.prisma.brand.create({ data: { name } });
    }
    return brand;
  }
  
  /**
   * Находит бренд по имени
   */
  async findByName(name: string) {
    return this.prisma.brand.findUnique({
      where: { name },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DistributorStatus } from '@prisma/client';

@Injectable()
export class DistributorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Создает или обновляет запись дистрибьютора с контактами и статусом
   */
  async create(data: {
    name: string;
    website?: string;
    email?: string;
    phone?: string;
    status?: DistributorStatus;
    notes?: string;
    rejectionReason?: string;
    brandName?: string;
  }) {
    // 1. Создаем или обновляем дистрибьютора
    const normalizedName = data.name.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '').trim().toUpperCase();
    const distributor = await this.prisma.distributor.upsert({
      where: { name: normalizedName },
      update: {
        website: data.website,
        email: data.email,
        phone: data.phone,
        status: data.status,
        notes: data.notes,
        rejectionReason: data.rejectionReason,
        lastContactAt: data.status ? new Date() : undefined,
      },
      create: {
        name: normalizedName,
        website: data.website,
        email: data.email,
        phone: data.phone,
        status: data.status || DistributorStatus.NEW,
        notes: data.notes,
        rejectionReason: data.rejectionReason,
        lastContactAt: data.status ? new Date() : undefined,
      },
    });

    // 2. Если передан бренд, сохраняем его в таблице Brand
    if (data.brandName) {
      const normalizedBrand = data.brandName.replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '').trim().toUpperCase();
      await this.prisma.brand.upsert({
        where: { name: normalizedBrand },
        update: {},
        create: { name: normalizedBrand },
      });
    }

    return distributor;
  }

  /**
   * Обновляет статус воронки и заметки дистрибьютора
   */
  async updateStatus(
    id: number,
    data: {
      status: DistributorStatus;
      notes?: string;
      rejectionReason?: string;
      email?: string;
      phone?: string;
    }
  ) {
    return this.prisma.distributor.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        rejectionReason: data.rejectionReason,
        email: data.email,
        phone: data.phone,
        lastContactAt: new Date(),
      },
    });
  }

  /**
   * Возвращает список всех дистрибьюторов (с фильтрацией по статусу при необходимости)
   */
  async findAll(status?: DistributorStatus) {
    return this.prisma.distributor.findMany({
      where: status ? { status } : undefined,
      include: {
        asins: {
          select: {
            id: true,
            code: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Находит дистрибьютора по ID
   */
  async findById(id: number) {
    return this.prisma.distributor.findUnique({
      where: { id },
      include: {
        asins: true,
      },
    });
  }
}

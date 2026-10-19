import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SupplierStatus, CommunicationType, Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    website?: string;
    country?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) {
    const normalizedName = data.name.trim().toUpperCase();
    return this.prisma.supplier.upsert({
      where: { name: normalizedName },
      update: {
        website: data.website,
        country: data.country,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      },
      create: {
        name: normalizedName,
        website: data.website,
        country: data.country,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        status: 'NEW',
      },
    });
  }

  async findAll(status?: SupplierStatus) {
    const where: Prisma.SupplierWhereInput = {};
    if (status) {
      where.status = status;
    }
    return this.prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { contacts: true } },
        communications: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: {
        contacts: true,
        communications: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        _count: {
          select: { purchases: true, supplierProducts: true },
        },
      },
    });
  }

  async updateStatus(
    id: number,
    data: {
      status: SupplierStatus;
      notes?: string;
      rejectionReason?: string;
    },
  ) {
    const updateData: Prisma.SupplierUpdateInput = {
      status: data.status,
      lastContactAt: new Date(),
    };
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.rejectionReason !== undefined) {
      updateData.rejectionReason = data.rejectionReason;
    }
    return this.prisma.supplier.update({
      where: { id },
      data: updateData,
    });
  }

  async addContact(
    supplierId: number,
    data: {
      name: string;
      role?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
    },
  ) {
    return this.prisma.supplierContact.create({
      data: {
        supplierId,
        name: data.name,
        role: data.role,
        email: data.email,
        phone: data.phone,
        isPrimary: data.isPrimary ?? false,
      },
    });
  }

  async updateContact(
    id: number,
    data: {
      name?: string;
      role?: string;
      email?: string;
      phone?: string;
      isPrimary?: boolean;
    },
  ) {
    return this.prisma.supplierContact.update({
      where: { id },
      data,
    });
  }

  async deleteContact(id: number) {
    return this.prisma.supplierContact.delete({ where: { id } });
  }

  async addCommunication(
    supplierId: number,
    data: {
      type: CommunicationType;
      summary: string;
      nextAction?: string;
      nextActionDate?: string;
    },
  ) {
    await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { lastContactAt: new Date() },
    });
    return this.prisma.supplierCommunication.create({
      data: {
        supplierId,
        type: data.type,
        summary: data.summary,
        nextAction: data.nextAction,
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : undefined,
      },
    });
  }

  async getFunnelStats() {
    const statuses: SupplierStatus[] = [
      'NEW',
      'RESEARCHING',
      'FORM_SUBMITTED',
      'EMAIL_SENT',
      'CALLED',
      'NEGOTIATING',
      'ACCOUNT_OPENED',
      'REJECTED',
      'INACTIVE',
    ];
    const counts = await Promise.all(
      statuses.map((status) =>
        this.prisma.supplier.count({ where: { status } }).then((count) => ({ status, count })),
      ),
    );
    const total = counts.reduce((sum, c) => sum + c.count, 0);
    return { total, statuses: counts };
  }
}
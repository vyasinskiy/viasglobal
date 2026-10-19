import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntityType, DocumentType, Prisma } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async upload(
    file: Express.Multer.File,
    data: {
      entityType: EntityType;
      entityId: number;
      documentType: DocumentType;
      notes?: string;
    },
  ) {
    const relation = {
      supplierId: data.entityType === 'SUPPLIER' ? data.entityId : undefined,
      purchaseId: data.entityType === 'PURCHASE' ? data.entityId : undefined,
      saleId: data.entityType === 'SALE' ? data.entityId : undefined,
      productId: data.entityType === 'PRODUCT' ? data.entityId : undefined,
    };

    return this.prisma.document.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        documentType: data.documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        notes: data.notes,
        ...relation,
      },
    });
  }

  async findByEntity(entityType: string, entityId: number) {
    return this.prisma.document.findMany({
      where: {
        entityType: entityType as EntityType,
        entityId,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findAll(entityType?: string, documentType?: string) {
    const where: Prisma.DocumentWhereInput = {};
    if (entityType) {
      where.entityType = entityType as EntityType;
    }
    if (documentType) {
      where.documentType = documentType as DocumentType;
    }
    return this.prisma.document.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async remove(id: number) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) return null;
    await this.prisma.document.delete({ where: { id } });
    await unlink(join(process.cwd(), document.filePath)).catch(() => undefined);
    return document;
  }

  async download(id: number) {
    return this.prisma.document.findUnique({ where: { id } });
  }
}

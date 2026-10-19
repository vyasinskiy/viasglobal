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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let DocumentsService = class DocumentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upload(file, data) {
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
    async findByEntity(entityType, entityId) {
        return this.prisma.document.findMany({
            where: {
                entityType: entityType,
                entityId,
            },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async findAll(entityType, documentType) {
        const where = {};
        if (entityType) {
            where.entityType = entityType;
        }
        if (documentType) {
            where.documentType = documentType;
        }
        return this.prisma.document.findMany({
            where,
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async findById(id) {
        return this.prisma.document.findUnique({ where: { id } });
    }
    async remove(id) {
        const document = await this.prisma.document.findUnique({ where: { id } });
        if (!document)
            return null;
        await this.prisma.document.delete({ where: { id } });
        await (0, promises_1.unlink)((0, path_1.join)(process.cwd(), document.filePath)).catch(() => undefined);
        return document;
    }
    async download(id) {
        return this.prisma.document.findUnique({ where: { id } });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map
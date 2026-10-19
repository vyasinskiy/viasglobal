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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let SuppliersService = class SuppliersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
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
    async findAll(status) {
        const where = {};
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
    async findById(id) {
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
    async updateStatus(id, data) {
        const updateData = {
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
    async addContact(supplierId, data) {
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
    async updateContact(id, data) {
        return this.prisma.supplierContact.update({
            where: { id },
            data,
        });
    }
    async deleteContact(id) {
        return this.prisma.supplierContact.delete({ where: { id } });
    }
    async addCommunication(supplierId, data) {
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
        const statuses = [
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
        const counts = await Promise.all(statuses.map((status) => this.prisma.supplier.count({ where: { status } }).then((count) => ({ status, count }))));
        const total = counts.reduce((sum, c) => sum + c.count, 0);
        return { total, statuses: counts };
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map
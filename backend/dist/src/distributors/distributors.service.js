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
exports.DistributorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DistributorsService = class DistributorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const distributor = await this.prisma.distributor.upsert({
            where: { name: data.name },
            update: { website: data.website },
            create: { name: data.name, website: data.website },
        });
        if (data.brandName) {
            await this.prisma.brand.upsert({
                where: { name: data.brandName },
                update: { isAnalyzed: true, isPrivateLabel: data.isPrivateLabel ?? false },
                create: { name: data.brandName, isAnalyzed: true, isPrivateLabel: data.isPrivateLabel ?? false }
            });
        }
        return distributor;
    }
};
exports.DistributorsService = DistributorsService;
exports.DistributorsService = DistributorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DistributorsService);
//# sourceMappingURL=distributors.service.js.map
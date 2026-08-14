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
exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BrandsService = class BrandsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkBrandAnalyzed(name) {
        let brand = await this.prisma.brand.findUnique({ where: { name } });
        if (!brand) {
            brand = await this.prisma.brand.create({ data: { name, isAnalyzed: false } });
        }
        return { isAnalyzed: brand.isAnalyzed, isPrivateLabel: brand.isPrivateLabel };
    }
    async markAsAnalyzed(name) {
        return this.prisma.brand.upsert({
            where: { name },
            update: { isAnalyzed: true },
            create: { name, isAnalyzed: true },
        });
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BrandsService);
//# sourceMappingURL=brands.service.js.map
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
const analytics_service_js_1 = require("./analytics.service.js");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getDashboard() {
        return this.analyticsService.getDashboard();
    }
    getMarginReport(fromDate, toDate, productId) {
        return this.analyticsService.getMarginReport(fromDate, toDate, productId ? Number(productId) : undefined);
    }
    getSupplierPerformance() {
        return this.analyticsService.getSupplierPerformance();
    }
    getSalesTrend(days, platformId) {
        return this.analyticsService.getSalesTrend(days ? Number(days) : undefined, platformId ? Number(platformId) : undefined);
    }
    getInventoryTurnover() {
        return this.analyticsService.getInventoryTurnover();
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('margin'),
    __param(0, (0, common_1.Query)('fromDate')),
    __param(1, (0, common_1.Query)('toDate')),
    __param(2, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getMarginReport", null);
__decorate([
    (0, common_1.Get)('supplier-performance'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSupplierPerformance", null);
__decorate([
    (0, common_1.Get)('sales-trend'),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, common_1.Query)('platformId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSalesTrend", null);
__decorate([
    (0, common_1.Get)('inventory-turnover'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getInventoryTurnover", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [analytics_service_js_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map
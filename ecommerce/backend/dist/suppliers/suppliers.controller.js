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
exports.SuppliersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
const suppliers_service_js_1 = require("./suppliers.service.js");
const client_1 = require("@prisma/client");
let SuppliersController = class SuppliersController {
    suppliersService;
    constructor(suppliersService) {
        this.suppliersService = suppliersService;
    }
    create(body) {
        return this.suppliersService.create(body);
    }
    findAll(status) {
        return this.suppliersService.findAll(status);
    }
    getFunnelStats() {
        return this.suppliersService.getFunnelStats();
    }
    findById(id) {
        return this.suppliersService.findById(id);
    }
    updateStatus(id, body) {
        return this.suppliersService.updateStatus(id, body);
    }
    addContact(supplierId, body) {
        return this.suppliersService.addContact(supplierId, body);
    }
    updateContact(contactId, body) {
        return this.suppliersService.updateContact(contactId, body);
    }
    deleteContact(contactId) {
        return this.suppliersService.deleteContact(contactId);
    }
    addCommunication(supplierId, body) {
        return this.suppliersService.addCommunication(supplierId, body);
    }
};
exports.SuppliersController = SuppliersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('funnel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "getFunnelStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/contacts'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "addContact", null);
__decorate([
    (0, common_1.Patch)('contacts/:contactId'),
    __param(0, (0, common_1.Param)('contactId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "updateContact", null);
__decorate([
    (0, common_1.Delete)('contacts/:contactId'),
    __param(0, (0, common_1.Param)('contactId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "deleteContact", null);
__decorate([
    (0, common_1.Post)(':id/communications'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], SuppliersController.prototype, "addCommunication", null);
exports.SuppliersController = SuppliersController = __decorate([
    (0, common_1.Controller)('suppliers'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [suppliers_service_js_1.SuppliersService])
], SuppliersController);
//# sourceMappingURL=suppliers.controller.js.map
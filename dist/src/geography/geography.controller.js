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
exports.GeographyController = void 0;
const common_1 = require("@nestjs/common");
const geography_service_1 = require("./geography.service");
const swagger_1 = require("@nestjs/swagger");
let GeographyController = class GeographyController {
    geographyService;
    constructor(geographyService) {
        this.geographyService = geographyService;
    }
    async getDistricts() {
        return this.geographyService.getDistricts();
    }
    async getTalukas(districtId) {
        return this.geographyService.getTalukas(districtId);
    }
    async getBooths(talukaId) {
        return this.geographyService.getBooths(talukaId);
    }
};
exports.GeographyController = GeographyController;
__decorate([
    (0, common_1.Get)('districts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of all districts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GeographyController.prototype, "getDistricts", null);
__decorate([
    (0, common_1.Get)('districts/:districtId/talukas'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of talukas within a district' }),
    __param(0, (0, common_1.Param)('districtId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeographyController.prototype, "getTalukas", null);
__decorate([
    (0, common_1.Get)('talukas/:talukaId/booths'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of booths within a taluka' }),
    __param(0, (0, common_1.Param)('talukaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GeographyController.prototype, "getBooths", null);
exports.GeographyController = GeographyController = __decorate([
    (0, swagger_1.ApiTags)('Geography Master'),
    (0, common_1.Controller)('geography'),
    __metadata("design:paramtypes", [geography_service_1.GeographyService])
], GeographyController);
//# sourceMappingURL=geography.controller.js.map
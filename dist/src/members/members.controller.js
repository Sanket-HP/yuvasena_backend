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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const members_service_1 = require("./members.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@yuvasena/shared");
let MembersController = class MembersController {
    membersService;
    constructor(membersService) {
        this.membersService = membersService;
    }
    async getMembers(query) {
        return this.membersService.findAll(query);
    }
    async exportExcel(res) {
        return this.membersService.exportExcel(res);
    }
    async getProfile(req) {
        return this.membersService.findByUserId(req.user.id);
    }
    async updateProfile(req, body) {
        const payload = { ...body, id: req.user.id };
        const parseResult = shared_1.ProfileUpdateSchema.safeParse(payload);
        if (!parseResult.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        return this.membersService.updateProfile(req.user.id, parseResult.data);
    }
    async getMember(id, req) {
        const member = await this.membersService.findOne(id);
        if (req.user.role === client_1.Role.MEMBER && member.userId !== req.user.id) {
            throw new common_1.ForbiddenException('You do not have permission to view this member profile');
        }
        return member;
    }
    async updateStatus(id, status, req) {
        if (!status) {
            throw new common_1.BadRequestException('Status field is required');
        }
        return this.membersService.updateStatus(id, status, req.user.id);
    }
    async downloadCard(id, res, req) {
        if (req.user.role === client_1.Role.MEMBER) {
            const member = await this.membersService.findOne(id);
            if (member.userId !== req.user.id) {
                throw new common_1.ForbiddenException('You cannot download another member\'s card');
            }
        }
        return this.membersService.generateCardPdf(id, res);
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STATE_ADMIN, client_1.Role.DISTRICT_ADMIN, client_1.Role.TALUKA_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List and filter all members (Admins only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'districtId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'talukaId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'bloodGroup', required: false, type: String }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STATE_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Export members list to Excel (State/Super Admins only)' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user member profile' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user member profile' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed member by ID (Admins or owner)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "getMember", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STATE_ADMIN, client_1.Role.DISTRICT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or suspend a member profile (Admins only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/card'),
    (0, swagger_1.ApiOperation)({ summary: 'Download member PDF digital card' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MembersController.prototype, "downloadCard", null);
exports.MembersController = MembersController = __decorate([
    (0, swagger_1.ApiTags)('Members'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('members'),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], MembersController);
//# sourceMappingURL=members.controller.js.map
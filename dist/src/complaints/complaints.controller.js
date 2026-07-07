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
exports.ComplaintsController = void 0;
const common_1 = require("@nestjs/common");
const complaints_service_1 = require("./complaints.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@yuvasena/shared");
let ComplaintsController = class ComplaintsController {
    complaintsService;
    constructor(complaintsService) {
        this.complaintsService = complaintsService;
    }
    async submit(body, req) {
        const parseResult = shared_1.ComplaintSubmitSchema.safeParse(body);
        if (!parseResult.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        return this.complaintsService.submit(parseResult.data, req.user.id);
    }
    async getMemberComplaints(req) {
        return this.complaintsService.findMemberComplaints(req.user.id);
    }
    async getAdminComplaints(districtId, status) {
        return this.complaintsService.findAll({ districtId, status });
    }
    async assign(id, req) {
        return this.complaintsService.assign(id, req.user.id);
    }
    async resolve(id, body, req) {
        const parseResult = shared_1.ComplaintResolveSchema.safeParse(body);
        if (!parseResult.success) {
            throw new common_1.BadRequestException({
                message: 'Validation failed',
                errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            });
        }
        return this.complaintsService.resolve(id, parseResult.data, req.user.id);
    }
};
exports.ComplaintsController = ComplaintsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a new complaint/grievance' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ComplaintsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current member\'s complaints history' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ComplaintsController.prototype, "getMemberComplaints", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STATE_ADMIN, client_1.Role.DISTRICT_ADMIN, client_1.Role.TALUKA_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'List all complaints (Admins only)' }),
    __param(0, (0, common_1.Query)('districtId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ComplaintsController.prototype, "getAdminComplaints", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STATE_ADMIN, client_1.Role.DISTRICT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a complaint to yourself (Admins only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ComplaintsController.prototype, "assign", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, roles_decorator_1.Roles)(client_1.Role.SUPER_ADMIN, client_1.Role.STATE_ADMIN, client_1.Role.DISTRICT_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Reply and update complaint status (Admins only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ComplaintsController.prototype, "resolve", null);
exports.ComplaintsController = ComplaintsController = __decorate([
    (0, swagger_1.ApiTags)('Complaints'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('complaints'),
    __metadata("design:paramtypes", [complaints_service_1.ComplaintsService])
], ComplaintsController);
//# sourceMappingURL=complaints.controller.js.map
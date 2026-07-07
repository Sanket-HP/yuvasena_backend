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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ComplaintsService = class ComplaintsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submit(input, userId) {
        const member = await this.prisma.member.findUnique({
            where: { userId }
        });
        if (!member) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        return this.prisma.complaint.create({
            data: {
                title: input.title,
                description: input.description,
                imageUrls: input.imageUrls,
                status: client_1.ComplaintStatus.SUBMITTED,
                memberId: member.id
            }
        });
    }
    async findMemberComplaints(userId) {
        const member = await this.prisma.member.findUnique({
            where: { userId }
        });
        if (!member) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        return this.prisma.complaint.findMany({
            where: { memberId: member.id },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findAll(query) {
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.districtId) {
            where.member = { districtId: query.districtId };
        }
        return this.prisma.complaint.findMany({
            where,
            include: {
                member: {
                    include: {
                        user: { select: { name: true, phone: true } },
                        district: true,
                        taluka: true
                    }
                },
                assignedAdmin: {
                    select: { name: true, phone: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async assign(id, adminUserId) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id } });
        if (!complaint) {
            throw new common_1.NotFoundException(`Complaint with ID ${id} not found`);
        }
        return this.prisma.complaint.update({
            where: { id },
            data: {
                status: client_1.ComplaintStatus.ASSIGNED,
                assignedAdminId: adminUserId
            }
        });
    }
    async resolve(id, input, adminUserId) {
        const complaint = await this.prisma.complaint.findUnique({ where: { id } });
        if (!complaint) {
            throw new common_1.NotFoundException(`Complaint with ID ${id} not found`);
        }
        return this.prisma.complaint.update({
            where: { id },
            data: {
                status: input.status,
                reply: input.reply,
                assignedAdminId: adminUserId
            }
        });
    }
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map
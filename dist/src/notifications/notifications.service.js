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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = class NotificationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        const notification = await this.prisma.notification.create({
            data: {
                title: input.title,
                body: input.body,
                targetAudience: input.targetAudience,
                districtId: input.districtId || null,
                scheduleTime: input.scheduleTime ? new Date(input.scheduleTime) : null,
                sentStatus: input.scheduleTime ? false : true
            }
        });
        if (!input.scheduleTime) {
            console.log(`[FCM Broadcast Notification] Title: "${input.title}" | Target: ${input.targetAudience}`);
        }
        return notification;
    }
    async findForMember(userId) {
        const member = await this.prisma.member.findUnique({
            where: { userId }
        });
        const conditions = [
            { targetAudience: 'ALL' }
        ];
        if (member) {
            conditions.push({ targetAudience: 'MEMBERS' });
            if (member.districtId) {
                conditions.push({
                    targetAudience: 'DISTRICT_ADMINS',
                    districtId: member.districtId
                });
            }
        }
        return this.prisma.notification.findMany({
            where: {
                OR: conditions,
                sentStatus: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findAllAdmin() {
        return this.prisma.notification.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
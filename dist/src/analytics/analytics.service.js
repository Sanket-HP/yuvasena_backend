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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalMembers, todayRegistrations, pendingApprovals, activeComplaints, totalEvents, districtGrowth] = await Promise.all([
            this.prisma.member.count(),
            this.prisma.member.count({
                where: { createdAt: { gte: today } }
            }),
            this.prisma.member.count({
                where: { status: 'PENDING' }
            }),
            this.prisma.complaint.count({
                where: { status: { in: ['SUBMITTED', 'ASSIGNED'] } }
            }),
            this.prisma.event.count(),
            this.prisma.member.groupBy({
                by: ['districtId'],
                _count: {
                    id: true
                }
            })
        ]);
        const districts = await this.prisma.district.findMany();
        const districtMap = new Map(districts.map(d => [d.id, d.name]));
        const growthData = districtGrowth.map(group => ({
            district: districtMap.get(group.districtId) || 'Unknown',
            count: group._count.id
        }));
        const dailyRegistrations = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);
            const count = await this.prisma.member.count({
                where: {
                    createdAt: {
                        gte: d,
                        lt: nextDay
                    }
                }
            });
            dailyRegistrations.push({
                date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                count
            });
        }
        return {
            summary: {
                totalMembers,
                todayRegistrations,
                pendingApprovals,
                activeComplaints,
                totalEvents
            },
            charts: {
                districtGrowth: growthData,
                dailyRegistrations
            }
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
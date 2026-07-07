"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const QRCode = __importStar(require("qrcode"));
const ExcelJS = __importStar(require("exceljs"));
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        const event = await this.prisma.event.create({
            data: {
                title: input.title,
                description: input.description,
                date: new Date(input.date),
                location: input.location,
                latitude: input.latitude,
                longitude: input.longitude,
                maxRegistrations: input.maxRegistrations,
                bannerUrl: input.bannerUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?fit=crop&w=800&h=450&q=80',
                status: 'UPCOMING'
            }
        });
        const qrCodeDataUrl = await QRCode.toDataURL(`EVENT-ATTENDANCE:${event.id}`);
        const updatedEvent = await this.prisma.event.update({
            where: { id: event.id },
            data: { qrCodeUrl: qrCodeDataUrl }
        });
        return updatedEvent;
    }
    async findAll(query) {
        const limit = Number(query.limit) || 20;
        const where = {};
        if (query.upcoming) {
            where.date = { gte: new Date() };
        }
        return this.prisma.event.findMany({
            where,
            take: limit,
            orderBy: { date: 'asc' }
        });
    }
    async findOne(id) {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                registrations: {
                    include: {
                        member: {
                            include: { user: true }
                        }
                    }
                },
                attendance: {
                    include: {
                        member: {
                            include: { user: true }
                        }
                    }
                }
            }
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }
    async registerForEvent(eventId, userId) {
        const member = await this.prisma.member.findUnique({
            where: { userId }
        });
        if (!member) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        if (member.status !== 'APPROVED') {
            throw new common_2.ForbiddenException('Only approved members can register for events');
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: { select: { registrations: true } }
            }
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        if (event.status !== 'UPCOMING') {
            throw new common_1.BadRequestException('Registration is only open for upcoming events');
        }
        if (event.maxRegistrations && event._count.registrations >= event.maxRegistrations) {
            throw new common_1.BadRequestException('Event is fully registered');
        }
        const existingRegistration = await this.prisma.registration.findUnique({
            where: {
                memberId_eventId: {
                    memberId: member.id,
                    eventId
                }
            }
        });
        if (existingRegistration) {
            throw new common_1.ConflictException('You are already registered for this event');
        }
        return this.prisma.registration.create({
            data: {
                memberId: member.id,
                eventId
            }
        });
    }
    async markAttendance(eventId, membershipNo, verifiedByAdminId) {
        const member = await this.prisma.member.findUnique({
            where: { membershipNo },
            include: { user: true }
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with membership number ${membershipNo} not found`);
        }
        const event = await this.prisma.event.findUnique({
            where: { id: eventId }
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        const existingAttendance = await this.prisma.attendance.findUnique({
            where: {
                memberId_eventId: {
                    memberId: member.id,
                    eventId
                }
            }
        });
        if (existingAttendance) {
            return {
                success: true,
                alreadyMarked: true,
                message: `Attendance already marked for ${member.user.name}`,
                member: {
                    name: member.user.name,
                    membershipNo: member.membershipNo
                }
            };
        }
        await this.prisma.attendance.create({
            data: {
                memberId: member.id,
                eventId,
                verifiedById: verifiedByAdminId
            }
        });
        return {
            success: true,
            alreadyMarked: false,
            message: `Attendance marked successfully for ${member.user.name}`,
            member: {
                name: member.user.name,
                membershipNo: member.membershipNo
            }
        };
    }
    async exportReport(eventId, res) {
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: {
                registrations: {
                    include: {
                        member: {
                            include: {
                                user: true,
                                district: true,
                                taluka: true
                            }
                        }
                    }
                },
                attendance: {
                    select: { memberId: true }
                }
            }
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${eventId} not found`);
        }
        const attendedSet = new Set(event.attendance.map(a => a.memberId));
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Event Attendees');
        worksheet.columns = [
            { header: 'Membership No', key: 'membershipNo', width: 18 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'District', key: 'district', width: 15 },
            { header: 'Taluka', key: 'taluka', width: 15 },
            { header: 'Registered At', key: 'registeredAt', width: 20 },
            { header: 'Attended?', key: 'attended', width: 12 }
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF6B00' }
        };
        for (const reg of event.registrations) {
            worksheet.addRow({
                membershipNo: reg.member.membershipNo,
                name: reg.member.user.name,
                phone: reg.member.user.phone,
                district: reg.member.district.name,
                taluka: reg.member.taluka.name,
                registeredAt: reg.registeredAt.toISOString().split('T')[0],
                attended: attendedSet.has(reg.member.id) ? 'YES' : 'NO'
            });
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Event_Report_${event.title.replace(/\s+/g, '_')}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
const common_2 = require("@nestjs/common");
//# sourceMappingURL=events.service.js.map
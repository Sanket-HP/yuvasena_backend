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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const QRCode = __importStar(require("qrcode"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const ExcelJS = __importStar(require("exceljs"));
let MembersService = class MembersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (query.districtId)
            where.districtId = query.districtId;
        if (query.talukaId)
            where.talukaId = query.talukaId;
        if (query.status)
            where.status = query.status;
        if (query.bloodGroup)
            where.bloodGroup = query.bloodGroup;
        if (query.search) {
            where.OR = [
                { membershipNo: { contains: query.search, mode: 'insensitive' } },
                { address: { contains: query.search, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { name: { contains: query.search, mode: 'insensitive' } },
                            { email: { contains: query.search, mode: 'insensitive' } },
                            { phone: { contains: query.search, mode: 'insensitive' } }
                        ]
                    }
                }
            ];
        }
        const [total, items] = await Promise.all([
            this.prisma.member.count({ where }),
            this.prisma.member.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            role: true
                        }
                    },
                    district: true,
                    taluka: true,
                    booth: true
                },
                orderBy: { createdAt: 'desc' }
            })
        ]);
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async findOne(id) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true
                    }
                },
                district: true,
                taluka: true,
                booth: true
            }
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        return member;
    }
    async findByUserId(userId) {
        const member = await this.prisma.member.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true
                    }
                },
                district: true,
                taluka: true,
                booth: true
            }
        });
        if (!member) {
            throw new common_1.NotFoundException(`Membership profile not found for user ID ${userId}`);
        }
        return member;
    }
    async updateProfile(userId, data) {
        const member = await this.prisma.member.findUnique({
            where: { userId }
        });
        if (!member) {
            throw new common_1.NotFoundException('Member profile not found');
        }
        const userUpdate = {};
        if (data.name)
            userUpdate.name = data.name;
        if (data.email)
            userUpdate.email = data.email;
        if (data.phone)
            userUpdate.phone = data.phone;
        await this.prisma.user.update({
            where: { id: userId },
            data: userUpdate
        });
        const memberUpdate = {};
        if (data.bloodGroup)
            memberUpdate.bloodGroup = data.bloodGroup;
        if (data.occupation)
            memberUpdate.occupation = data.occupation;
        if (data.address)
            memberUpdate.address = data.address;
        if (data.districtId)
            memberUpdate.districtId = data.districtId;
        if (data.talukaId)
            memberUpdate.talukaId = data.talukaId;
        if (data.boothId)
            memberUpdate.boothId = data.boothId;
        if (data.profilePhotoUrl)
            memberUpdate.profilePhotoUrl = data.profilePhotoUrl;
        if (data.facebookUrl !== undefined)
            memberUpdate.facebookUrl = data.facebookUrl;
        if (data.twitterUrl !== undefined)
            memberUpdate.twitterUrl = data.twitterUrl;
        if (data.instagramUrl !== undefined)
            memberUpdate.instagramUrl = data.instagramUrl;
        const updatedMember = await this.prisma.member.update({
            where: { userId },
            data: memberUpdate,
            include: {
                user: {
                    select: { name: true, email: true, phone: true }
                },
                district: true,
                taluka: true,
                booth: true
            }
        });
        return updatedMember;
    }
    async updateStatus(id, status, adminUserId) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        if (!['PENDING', 'APPROVED', 'SUSPENDED'].includes(status)) {
            throw new common_1.BadRequestException('Invalid status value. Must be PENDING, APPROVED, or SUSPENDED.');
        }
        const updated = await this.prisma.member.update({
            where: { id },
            data: { status },
            include: { user: true }
        });
        await this.prisma.auditLog.create({
            data: {
                userId: adminUserId,
                action: 'UPDATE_MEMBER_STATUS',
                details: `Updated status of member ${member.membershipNo} (${member.user.name}) to ${status}`
            }
        });
        return updated;
    }
    async generateCardPdf(id, res) {
        const member = await this.prisma.member.findUnique({
            where: { id },
            include: {
                user: true,
                district: true,
                taluka: true
            }
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID ${id} not found`);
        }
        const qrCodeDataUrl = await QRCode.toDataURL(member.membershipNo);
        const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        const doc = new pdfkit_1.default({ size: [300, 480], margin: 15 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=YS_Membership_Card_${member.membershipNo}.pdf`);
        doc.pipe(res);
        doc.rect(5, 5, 290, 470).lineWidth(4).stroke('#FF6B00');
        doc.rect(5, 5, 290, 80).fill('#FF6B00');
        doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('YUVA SENA', 15, 25, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('DIGITAL MEMBERSHIP CARD', 15, 50, { align: 'center' });
        doc.rect(100, 110, 100, 110).lineWidth(1).stroke('#1E1E24');
        doc.fillColor('#F8F9FA').rect(101, 111, 98, 108).fill();
        doc.fillColor('#1E1E24').fontSize(8).font('Helvetica').text('PHOTO', 100, 160, { width: 100, align: 'center' });
        doc.fillColor('#1E1E24').fontSize(14).font('Helvetica-Bold').text(member.user.name, 15, 240, { align: 'center' });
        doc.fontSize(10).font('Helvetica').fillColor('#FF6B00').text(`ID: ${member.membershipNo}`, 15, 260, { align: 'center' });
        doc.fillColor('#1E1E24').fontSize(9).font('Helvetica');
        let detailsY = 290;
        const drawLine = (label, value) => {
            doc.font('Helvetica-Bold').text(`${label}: `, 30, detailsY);
            doc.font('Helvetica').text(value, 100, detailsY);
            detailsY += 18;
        };
        drawLine('Mobile', member.user.phone);
        drawLine('District', member.district.name);
        drawLine('Taluka', member.taluka.name);
        drawLine('Blood Group', member.bloodGroup);
        drawLine('Status', member.status);
        doc.image(qrCodeBuffer, 110, 380, { width: 80, height: 80 });
        doc.fillColor('#777777').fontSize(7).text('Valid official digital copy of Yuva Sena', 15, 460, { align: 'center' });
        doc.end();
    }
    async exportExcel(res) {
        const members = await this.prisma.member.findMany({
            include: {
                user: true,
                district: true,
                taluka: true,
                booth: true
            }
        });
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Members List');
        worksheet.columns = [
            { header: 'Membership No', key: 'membershipNo', width: 18 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'District', key: 'district', width: 15 },
            { header: 'Taluka', key: 'taluka', width: 15 },
            { header: 'Booth', key: 'booth', width: 15 },
            { header: 'Blood Group', key: 'bloodGroup', width: 12 },
            { header: 'Occupation', key: 'occupation', width: 18 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Registration Date', key: 'createdAt', width: 20 }
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF6B00' }
        };
        for (const m of members) {
            worksheet.addRow({
                membershipNo: m.membershipNo,
                name: m.user.name,
                email: m.user.email,
                phone: m.user.phone,
                district: m.district.name,
                taluka: m.taluka.name,
                booth: m.booth ? m.booth.name : 'N/A',
                bloodGroup: m.bloodGroup,
                occupation: m.occupation,
                status: m.status,
                createdAt: m.createdAt.toISOString().split('T')[0]
            });
        }
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=YuvaSena_Members_Roster.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembersService);
//# sourceMappingURL=members.service.js.map
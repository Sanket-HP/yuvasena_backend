import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    districtId?: string;
    talukaId?: string;
    status?: string;
    bloodGroup?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.districtId) where.districtId = query.districtId;
    if (query.talukaId) where.talukaId = query.talukaId;
    if (query.status) where.status = query.status;
    if (query.bloodGroup) where.bloodGroup = query.bloodGroup;

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

  async findOne(id: string) {
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
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  async findByUserId(userId: string) {
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
      throw new NotFoundException(`Membership profile not found for user ID ${userId}`);
    }

    return member;
  }

  async updateProfile(userId: string, data: any) {
    const member = await this.prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    // Update user name / email / phone
    const userUpdate: any = {};
    if (data.name) userUpdate.name = data.name;
    if (data.email) userUpdate.email = data.email;
    if (data.phone) userUpdate.phone = data.phone;

    await this.prisma.user.update({
      where: { id: userId },
      data: userUpdate
    });

    // Update member profile info
    const memberUpdate: any = {};
    if (data.bloodGroup) memberUpdate.bloodGroup = data.bloodGroup;
    if (data.occupation) memberUpdate.occupation = data.occupation;
    if (data.address) memberUpdate.address = data.address;
    if (data.districtId) memberUpdate.districtId = data.districtId;
    if (data.talukaId) memberUpdate.talukaId = data.talukaId;
    if (data.boothId) memberUpdate.boothId = data.boothId;
    if (data.profilePhotoUrl) memberUpdate.profilePhotoUrl = data.profilePhotoUrl;
    if (data.facebookUrl !== undefined) memberUpdate.facebookUrl = data.facebookUrl;
    if (data.twitterUrl !== undefined) memberUpdate.twitterUrl = data.twitterUrl;
    if (data.instagramUrl !== undefined) memberUpdate.instagramUrl = data.instagramUrl;

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

  async updateStatus(id: string, status: string, adminUserId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    if (!['PENDING', 'APPROVED', 'SUSPENDED'].includes(status)) {
      throw new BadRequestException('Invalid status value. Must be PENDING, APPROVED, or SUSPENDED.');
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data: { status },
      include: { user: true }
    });

    // Log the audit trial
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_MEMBER_STATUS',
        details: `Updated status of member ${member.membershipNo} (${member.user.name}) to ${status}`
      }
    });

    return updated;
  }

  async generateCardPdf(id: string, res: Response) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        user: true,
        district: true,
        taluka: true
      }
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    // Generate QR Code buffer
    const qrCodeDataUrl = await QRCode.toDataURL(member.membershipNo);
    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Create PDF Document
    const doc = new PDFDocument({ size: [300, 480], margin: 15 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=YS_Membership_Card_${member.membershipNo}.pdf`);
    doc.pipe(res);

    // Styling & Card layout
    // Background Saffron Gradient Border
    doc.rect(5, 5, 290, 470).lineWidth(4).stroke('#FF6B00');
    
    // Header
    doc.rect(5, 5, 290, 80).fill('#FF6B00');
    doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('YUVA SENA', 15, 25, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('DIGITAL MEMBERSHIP CARD', 15, 50, { align: 'center' });

    // Profile Pic placeholder (uses a fallback drawing if photo url is missing or not locally loadable)
    // Draw a bounding rectangle for photo
    doc.rect(100, 110, 100, 110).lineWidth(1).stroke('#1E1E24');
    doc.fillColor('#F8F9FA').rect(101, 111, 98, 108).fill();
    doc.fillColor('#1E1E24').fontSize(8).font('Helvetica').text('PHOTO', 100, 160, { width: 100, align: 'center' });

    // Member Info
    doc.fillColor('#1E1E24').fontSize(14).font('Helvetica-Bold').text(member.user.name, 15, 240, { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#FF6B00').text(`ID: ${member.membershipNo}`, 15, 260, { align: 'center' });

    doc.fillColor('#1E1E24').fontSize(9).font('Helvetica');
    let detailsY = 290;
    const drawLine = (label: string, value: string) => {
      doc.font('Helvetica-Bold').text(`${label}: `, 30, detailsY);
      doc.font('Helvetica').text(value, 100, detailsY);
      detailsY += 18;
    };

    drawLine('Mobile', member.user.phone);
    drawLine('District', member.district.name);
    drawLine('Taluka', member.taluka.name);
    drawLine('Blood Group', member.bloodGroup);
    drawLine('Status', member.status);

    // Embed QR Code
    doc.image(qrCodeBuffer, 110, 380, { width: 80, height: 80 });

    // Footer copyright
    doc.fillColor('#777777').fontSize(7).text('Valid official digital copy of Yuva Sena', 15, 460, { align: 'center' });

    doc.end();
  }

  async exportExcel(res: Response) {
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

    // Format headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B00' } // Saffron
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
}

import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventCreateInput } from '@yuvasena/shared';
import * as QRCode from 'qrcode';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(input: EventCreateInput) {
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

    // Generate event QR code URL for attendance verification
    const qrCodeDataUrl = await QRCode.toDataURL(`EVENT-ATTENDANCE:${event.id}`);
    const updatedEvent = await this.prisma.event.update({
      where: { id: event.id },
      data: { qrCodeUrl: qrCodeDataUrl }
    });

    return updatedEvent;
  }

  async findAll(query: { upcoming?: boolean; limit?: number }) {
    const limit = Number(query.limit) || 20;
    const where: any = {};
    
    if (query.upcoming) {
      where.date = { gte: new Date() };
    }

    return this.prisma.event.findMany({
      where,
      take: limit,
      orderBy: { date: 'asc' }
    });
  }

  async findOne(id: string) {
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
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async registerForEvent(eventId: string, userId: string) {
    // 1. Get Member Profile
    const member = await this.prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    if (member.status !== 'APPROVED') {
      throw new ForbiddenException('Only approved members can register for events');
    }

    // 2. Get Event details
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: { select: { registrations: true } }
      }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.status !== 'UPCOMING') {
      throw new BadRequestException('Registration is only open for upcoming events');
    }

    if (event.maxRegistrations && event._count.registrations >= event.maxRegistrations) {
      throw new BadRequestException('Event is fully registered');
    }

    // 3. Register
    const existingRegistration = await this.prisma.registration.findUnique({
      where: {
        memberId_eventId: {
          memberId: member.id,
          eventId
        }
      }
    });

    if (existingRegistration) {
      throw new ConflictException('You are already registered for this event');
    }

    return this.prisma.registration.create({
      data: {
        memberId: member.id,
        eventId
      }
    });
  }

  async markAttendance(eventId: string, membershipNo: string, verifiedByAdminId: string) {
    // 1. Find Member by Membership Number
    const member = await this.prisma.member.findUnique({
      where: { membershipNo },
      include: { user: true }
    });

    if (!member) {
      throw new NotFoundException(`Member with membership number ${membershipNo} not found`);
    }

    // 2. Validate Event
    const event = await this.prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // 3. Mark Attendance (upsert or simple create)
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

  async exportReport(eventId: string, res: Response) {
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
      throw new NotFoundException(`Event with ID ${eventId} not found`);
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
}
import { ForbiddenException } from '@nestjs/common';

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplaintSubmitInput, ComplaintResolveInput } from '@yuvasena/shared';
import { ComplaintStatus } from '@prisma/client';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async submit(input: ComplaintSubmitInput, userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    return this.prisma.complaint.create({
      data: {
        title: input.title,
        description: input.description,
        imageUrls: input.imageUrls,
        status: ComplaintStatus.SUBMITTED,
        memberId: member.id
      }
    });
  }

  async findMemberComplaints(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId }
    });

    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    return this.prisma.complaint.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAll(query: { districtId?: string; status?: ComplaintStatus }) {
    const where: any = {};
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

  async assign(id: string, adminUserId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.ASSIGNED,
        assignedAdminId: adminUserId
      }
    });
  }

  async resolve(id: string, input: ComplaintResolveInput, adminUserId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: input.status as ComplaintStatus,
        reply: input.reply,
        assignedAdminId: adminUserId
      }
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCreateInput } from '@yuvasena/shared';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(input: NotificationCreateInput) {
    const notification = await this.prisma.notification.create({
      data: {
        title: input.title,
        body: input.body,
        targetAudience: input.targetAudience,
        districtId: input.districtId || null,
        scheduleTime: input.scheduleTime ? new Date(input.scheduleTime) : null,
        sentStatus: input.scheduleTime ? false : true // Sent immediately if no schedule
      }
    });

    if (!input.scheduleTime) {
      // In production: trigger Firebase Cloud Messaging (FCM) broadcast here.
      console.log(`[FCM Broadcast Notification] Title: "${input.title}" | Target: ${input.targetAudience}`);
    }

    return notification;
  }

  async findForMember(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId }
    });

    const conditions: any[] = [
      { targetAudience: 'ALL' }
    ];

    if (member) {
      conditions.push({ targetAudience: 'MEMBERS' });
      if (member.districtId) {
        conditions.push({
          targetAudience: 'DISTRICT_ADMINS', // In case district scope matches or special targeting
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
}

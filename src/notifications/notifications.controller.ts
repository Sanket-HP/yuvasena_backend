import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Req, 
  BadRequestException 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationCreateSchema } from '@yuvasena/shared';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get targeting notifications history for current user' })
  async getMyNotifications(@Req() req: any) {
    return this.notificationsService.findForMember(req.user.id);
  }

  @Get('admin')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN)
  @ApiOperation({ summary: 'List all notifications broadcast history (Admins only)' })
  async getAllAdmin() {
    return this.notificationsService.findAllAdmin();
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN)
  @ApiOperation({ summary: 'Send or schedule a new broadcast notification (Admins only)' })
  async sendNotification(@Body() body: any) {
    const parseResult = NotificationCreateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.notificationsService.create(parseResult.data);
  }
}

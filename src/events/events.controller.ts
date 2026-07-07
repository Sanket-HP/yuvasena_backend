import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  Req, 
  Res, 
  BadRequestException 
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventCreateSchema } from '@yuvasena/shared';
import { Response } from 'express';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List all events' })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEvents(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details by ID' })
  async getEvent(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event (Admins only)' })
  async createEvent(@Body() body: any) {
    const parseResult = EventCreateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.eventsService.create(parseResult.data);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register current member for an event' })
  async register(@Param('id') id: string, @Req() req: any) {
    return this.eventsService.registerForEvent(id, req.user.id);
  }

  @Post(':id/attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify member attendance via scanning their QR membership card (Admins/Volunteers)' })
  async markAttendance(
    @Param('id') id: string,
    @Body('membershipNo') membershipNo: string,
    @Req() req: any
  ) {
    if (!membershipNo) {
      throw new BadRequestException('Membership number is required');
    }
    return this.eventsService.markAttendance(id, membershipNo, req.user.id);
  }

  @Get(':id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export event registration and attendance sheet to Excel (Admins only)' })
  async exportReport(@Param('id') id: string, @Res() res: Response) {
    return this.eventsService.exportReport(id, res);
  }
}

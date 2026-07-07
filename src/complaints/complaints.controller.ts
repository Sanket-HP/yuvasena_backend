import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  Req, 
  BadRequestException 
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, ComplaintStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ComplaintSubmitSchema, ComplaintResolveSchema } from '@yuvasena/shared';

@ApiTags('Complaints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new complaint/grievance' })
  async submit(@Body() body: any, @Req() req: any) {
    const parseResult = ComplaintSubmitSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.complaintsService.submit(parseResult.data, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get current member\'s complaints history' })
  async getMemberComplaints(@Req() req: any) {
    return this.complaintsService.findMemberComplaints(req.user.id);
  }

  @Get('admin')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN)
  @ApiOperation({ summary: 'List all complaints (Admins only)' })
  async getAdminComplaints(
    @Query('districtId') districtId?: string,
    @Query('status') status?: ComplaintStatus
  ) {
    return this.complaintsService.findAll({ districtId, status });
  }

  @Patch(':id/assign')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Assign a complaint to yourself (Admins only)' })
  async assign(@Param('id') id: string, @Req() req: any) {
    return this.complaintsService.assign(id, req.user.id);
  }

  @Patch(':id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Reply and update complaint status (Admins only)' })
  async resolve(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any
  ) {
    const parseResult = ComplaintResolveSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.complaintsService.resolve(id, parseResult.data, req.user.id);
  }
}

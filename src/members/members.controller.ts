import { 
  Controller, 
  Get, 
  Put, 
  Patch, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  Req, 
  Res, 
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProfileUpdateSchema } from '@yuvasena/shared';
import { Response } from 'express';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN)
  @ApiOperation({ summary: 'List and filter all members (Admins only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'districtId', required: false, type: String })
  @ApiQuery({ name: 'talukaId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'bloodGroup', required: false, type: String })
  async getMembers(@Query() query: any) {
    return this.membersService.findAll(query);
  }

  @Get('export/excel')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN)
  @ApiOperation({ summary: 'Export members list to Excel (State/Super Admins only)' })
  async exportExcel(@Res() res: Response) {
    return this.membersService.exportExcel(res);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user member profile' })
  async getProfile(@Req() req: any) {
    return this.membersService.findByUserId(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current user member profile' })
  async updateProfile(@Req() req: any, @Body() body: any) {
    // Add logged-in userId to validation
    const payload = { ...body, id: req.user.id };
    const parseResult = ProfileUpdateSchema.safeParse(payload);
    
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }

    return this.membersService.updateProfile(req.user.id, parseResult.data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed member by ID (Admins or owner)' })
  async getMember(@Param('id') id: string, @Req() req: any) {
    const member = await this.membersService.findOne(id);
    
    // Check ownership or admin privilege
    if (req.user.role === Role.MEMBER && member.userId !== req.user.id) {
      throw new ForbiddenException('You do not have permission to view this member profile');
    }
    
    return member;
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Approve or suspend a member profile (Admins only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any
  ) {
    if (!status) {
      throw new BadRequestException('Status field is required');
    }
    return this.membersService.updateStatus(id, status, req.user.id);
  }

  @Get(':id/card')
  @ApiOperation({ summary: 'Download member PDF digital card' })
  async downloadCard(@Param('id') id: string, @Res() res: Response, @Req() req: any) {
    // Check authorization: must be admin or card owner
    if (req.user.role === Role.MEMBER) {
      const member = await this.membersService.findOne(id);
      if (member.userId !== req.user.id) {
        throw new ForbiddenException('You cannot download another member\'s card');
      }
    }
    return this.membersService.generateCardPdf(id, res);
  }
}

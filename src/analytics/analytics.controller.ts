import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Retrieve dashboard analytics counters and chart aggregates (Admins only)' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { GeographyService } from './geography.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Geography Master')
@Controller('geography')
export class GeographyController {
  constructor(private geographyService: GeographyService) {}

  @Get('districts')
  @ApiOperation({ summary: 'Get list of all districts' })
  async getDistricts() {
    return this.geographyService.getDistricts();
  }

  @Get('districts/:districtId/talukas')
  @ApiOperation({ summary: 'Get list of talukas within a district' })
  async getTalukas(@Param('districtId') districtId: string) {
    return this.geographyService.getTalukas(districtId);
  }

  @Get('talukas/:talukaId/booths')
  @ApiOperation({ summary: 'Get list of booths within a taluka' })
  async getBooths(@Param('talukaId') talukaId: string) {
    return this.geographyService.getBooths(talukaId);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeographyService {
  constructor(private prisma: PrismaService) {}

  async getDistricts() {
    return this.prisma.district.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async getTalukas(districtId: string) {
    return this.prisma.taluka.findMany({
      where: { districtId },
      orderBy: { name: 'asc' }
    });
  }

  async getBooths(talukaId: string) {
    return this.prisma.booth.findMany({
      where: { talukaId },
      orderBy: { name: 'asc' }
    });
  }
}

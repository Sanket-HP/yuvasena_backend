import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  BadRequestException 
} from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'List all media files (photos/videos)' })
  async getMedia(
    @Query('type') type?: string,
    @Query('albumName') albumName?: string
  ) {
    return this.galleryService.findAll({ type, albumName });
  }

  @Get('albums')
  @ApiOperation({ summary: 'Get list of unique album names' })
  async getAlbums() {
    return this.galleryService.getAlbums();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a new media entry (Admins only)' })
  async addMedia(@Body() body: { title: string; url: string; type: string; albumName: string }) {
    if (!body.title || !body.url || !body.type || !body.albumName) {
      throw new BadRequestException('Title, url, type (PHOTO/VIDEO), and albumName are required');
    }
    return this.galleryService.create(body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a media entry (Admins only)' })
  async deleteMedia(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}

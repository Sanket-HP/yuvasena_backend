import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Query, 
  Param, 
  UseGuards, 
  BadRequestException 
} from '@nestjs/common';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NewsCreateSchema } from '@yuvasena/shared';

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all published news' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'trending', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getNews(
    @Query('category') category?: string,
    @Query('trending') trending?: string,
    @Query('limit') limit?: number
  ) {
    const isTrending = trending === 'true' ? true : trending === 'false' ? false : undefined;
    return this.newsService.findAll({ category, trending: isTrending, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get news details by ID' })
  async getOneNews(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish news article (Admins only)' })
  async createNews(@Body() body: any) {
    const parseResult = NewsCreateSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.newsService.create(parseResult.data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update news article details (Admins only)' })
  async updateNews(@Param('id') id: string, @Body() body: any) {
    return this.newsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.STATE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete news article (Admins only)' })
  async deleteNews(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}

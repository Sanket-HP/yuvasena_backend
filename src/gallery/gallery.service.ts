import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MediaType } from '@prisma/client';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; url: string; type: string; albumName: string }) {
    return this.prisma.gallery.create({
      data: {
        title: data.title,
        url: data.url,
        type: data.type as MediaType,
        albumName: data.albumName
      }
    });
  }

  async findAll(query: { type?: string; albumName?: string }) {
    const where: any = {};
    if (query.type) {
      where.type = query.type as MediaType;
    }
    if (query.albumName) {
      where.albumName = query.albumName;
    }
    return this.prisma.gallery.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAlbums() {
    const albums = await this.prisma.gallery.findMany({
      select: { albumName: true },
      distinct: ['albumName']
    });
    return albums.map(a => a.albumName);
  }

  async remove(id: string) {
    const media = await this.prisma.gallery.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundException(`Media file with ID ${id} not found`);
    }
    return this.prisma.gallery.delete({ where: { id } });
  }
}

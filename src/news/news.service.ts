import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NewsCreateInput } from '@yuvasena/shared';
import { PublishStatus } from '@prisma/client';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async create(input: NewsCreateInput) {
    return this.prisma.news.create({
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
        imageUrl: input.imageUrl,
        isTrending: input.isTrending,
        publishStatus: input.publishStatus as PublishStatus,
        publishAt: input.publishAt ? new Date(input.publishAt) : new Date()
      }
    });
  }

  async findAll(query: { category?: string; trending?: boolean; limit?: number }) {
    const limit = Number(query.limit) || 20;
    const where: any = {
      publishStatus: PublishStatus.PUBLISHED
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.trending !== undefined) {
      where.isTrending = query.trending;
    }

    return this.prisma.news.findMany({
      where,
      take: limit,
      orderBy: { publishAt: 'desc' }
    });
  }

  async findOne(id: string) {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }
    return news;
  }

  async update(id: string, input: Partial<NewsCreateInput>) {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    const data: any = {};
    if (input.title) data.title = input.title;
    if (input.content) data.content = input.content;
    if (input.category) data.category = input.category;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;
    if (input.isTrending !== undefined) data.isTrending = input.isTrending;
    if (input.publishStatus) data.publishStatus = input.publishStatus as PublishStatus;
    if (input.publishAt) data.publishAt = new Date(input.publishAt);

    return this.prisma.news.update({
      where: { id },
      data
    });
  }

  async remove(id: string) {
    const news = await this.prisma.news.findUnique({ where: { id } });
    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }
    return this.prisma.news.delete({ where: { id } });
  }
}

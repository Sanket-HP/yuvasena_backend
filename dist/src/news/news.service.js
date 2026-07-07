"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let NewsService = class NewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        return this.prisma.news.create({
            data: {
                title: input.title,
                content: input.content,
                category: input.category,
                imageUrl: input.imageUrl,
                isTrending: input.isTrending,
                publishStatus: input.publishStatus,
                publishAt: input.publishAt ? new Date(input.publishAt) : new Date()
            }
        });
    }
    async findAll(query) {
        const limit = Number(query.limit) || 20;
        const where = {
            publishStatus: client_1.PublishStatus.PUBLISHED
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
    async findOne(id) {
        const news = await this.prisma.news.findUnique({ where: { id } });
        if (!news) {
            throw new common_1.NotFoundException(`News with ID ${id} not found`);
        }
        return news;
    }
    async update(id, input) {
        const news = await this.prisma.news.findUnique({ where: { id } });
        if (!news) {
            throw new common_1.NotFoundException(`News with ID ${id} not found`);
        }
        const data = {};
        if (input.title)
            data.title = input.title;
        if (input.content)
            data.content = input.content;
        if (input.category)
            data.category = input.category;
        if (input.imageUrl !== undefined)
            data.imageUrl = input.imageUrl;
        if (input.isTrending !== undefined)
            data.isTrending = input.isTrending;
        if (input.publishStatus)
            data.publishStatus = input.publishStatus;
        if (input.publishAt)
            data.publishAt = new Date(input.publishAt);
        return this.prisma.news.update({
            where: { id },
            data
        });
    }
    async remove(id) {
        const news = await this.prisma.news.findUnique({ where: { id } });
        if (!news) {
            throw new common_1.NotFoundException(`News with ID ${id} not found`);
        }
        return this.prisma.news.delete({ where: { id } });
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NewsService);
//# sourceMappingURL=news.service.js.map
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
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GalleryService = class GalleryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.gallery.create({
            data: {
                title: data.title,
                url: data.url,
                type: data.type,
                albumName: data.albumName
            }
        });
    }
    async findAll(query) {
        const where = {};
        if (query.type) {
            where.type = query.type;
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
    async remove(id) {
        const media = await this.prisma.gallery.findUnique({ where: { id } });
        if (!media) {
            throw new common_1.NotFoundException(`Media file with ID ${id} not found`);
        }
        return this.prisma.gallery.delete({ where: { id } });
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map
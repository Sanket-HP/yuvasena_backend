"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    jwtService;
    otpCache = new Map();
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(input) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: input.email },
                    { phone: input.phone }
                ]
            }
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or mobile number already exists');
        }
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email: input.email,
                    phone: input.phone,
                    password: hashedPassword,
                    name: input.name,
                    role: client_1.Role.MEMBER
                }
            });
            const count = await tx.member.count();
            const paddedCount = String(count + 1).padStart(4, '0');
            const membershipNo = `YS-${new Date().getFullYear()}-${paddedCount}`;
            await tx.member.create({
                data: {
                    userId: newUser.id,
                    membershipNo,
                    status: 'PENDING',
                    bloodGroup: input.bloodGroup,
                    occupation: input.occupation,
                    address: input.address,
                    profilePhotoUrl: input.profilePhotoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?fit=crop&w=150&h=150&q=80',
                    facebookUrl: input.facebookUrl,
                    twitterUrl: input.twitterUrl,
                    instagramUrl: input.instagramUrl,
                    districtId: input.districtId,
                    talukaId: input.talukaId,
                    boothId: input.booth ? input.booth : undefined,
                    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${membershipNo}`
                }
            });
            return newUser;
        });
        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            status: 'PENDING',
            message: 'Registration successful. Profile pending admin approval.'
        };
    }
    async loginWithEmail(input) {
        const user = await this.prisma.user.findUnique({
            where: { email: input.email },
            include: { memberProfile: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.role === client_1.Role.MEMBER && user.memberProfile && user.memberProfile.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Your membership has been suspended. Please contact admin.');
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        return this.generateTokenResponse(user);
    }
    async requestOtp(input) {
        const phone = input.phone;
        const otpCode = '123456';
        const expiresAt = Date.now() + 5 * 60 * 1000;
        this.otpCache.set(phone, { code: otpCode, expires: expiresAt });
        console.log(`[SMS OTP MOCK] Sent OTP ${otpCode} to ${phone}`);
        return {
            success: true,
            message: 'OTP sent successfully',
            debugOtp: otpCode
        };
    }
    async verifyOtp(input) {
        const cached = this.otpCache.get(input.phone);
        if (!cached) {
            throw new common_1.BadRequestException('No OTP request found for this mobile number');
        }
        if (Date.now() > cached.expires) {
            this.otpCache.delete(input.phone);
            throw new common_1.BadRequestException('OTP has expired');
        }
        if (cached.code !== input.code) {
            throw new common_1.BadRequestException('Incorrect OTP code');
        }
        this.otpCache.delete(input.phone);
        let user = await this.prisma.user.findUnique({
            where: { phone: input.phone },
            include: { memberProfile: true }
        });
        if (!user) {
            return {
                isNewUser: true,
                phone: input.phone,
                message: 'OTP verified. Profile creation required.'
            };
        }
        if (user.role === client_1.Role.MEMBER && user.memberProfile && user.memberProfile.status === 'SUSPENDED') {
            throw new common_1.UnauthorizedException('Your membership has been suspended. Please contact admin.');
        }
        const tokens = await this.generateTokenResponse(user);
        return {
            isNewUser: false,
            ...tokens
        };
    }
    async generateTokenResponse(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            phone: user.phone,
            role: user.role
        };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                role: user.role,
                memberProfile: user.memberProfile ? {
                    id: user.memberProfile.id,
                    membershipNo: user.memberProfile.membershipNo,
                    status: user.memberProfile.status
                } : null
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
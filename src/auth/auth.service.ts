import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { 
  EmailLoginInput, 
  OtpRequestInput, 
  OtpVerifyInput, 
  MemberRegisterInput 
} from '@yuvasena/shared';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  // Temporary in-memory OTP cache (phone -> { otpCode, expiresAt })
  private otpCache = new Map<string, { code: string; expires: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(input: MemberRegisterInput) {
    // 1. Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          { phone: input.phone }
        ]
      }
    });

    if (existingUser) {
      throw new ConflictException('User with this email or mobile number already exists');
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // 3. Create User and Member profiles in a Transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          phone: input.phone,
          password: hashedPassword,
          name: input.name,
          role: Role.MEMBER
        }
      });

      // Generate a unique membership number
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

  async loginWithEmail(input: EmailLoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: { memberProfile: true }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check membership status if it is a standard member
    if (user.role === Role.MEMBER && user.memberProfile && user.memberProfile.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your membership has been suspended. Please contact admin.');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokenResponse(user);
  }

  async requestOtp(input: OtpRequestInput) {
    // Check if user exists. If not, we still return success but send mock OTP to let client complete setup
    const phone = input.phone;
    
    // In production, invoke SMS gateway API. In development/testing, use mock OTP 123456
    const otpCode = '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.otpCache.set(phone, { code: otpCode, expires: expiresAt });
    console.log(`[SMS OTP MOCK] Sent OTP ${otpCode} to ${phone}`);

    return {
      success: true,
      message: 'OTP sent successfully',
      debugOtp: otpCode // Returned in response for testing
    };
  }

  async verifyOtp(input: OtpVerifyInput) {
    const cached = this.otpCache.get(input.phone);

    if (!cached) {
      throw new BadRequestException('No OTP request found for this mobile number');
    }

    if (Date.now() > cached.expires) {
      this.otpCache.delete(input.phone);
      throw new BadRequestException('OTP has expired');
    }

    if (cached.code !== input.code) {
      throw new BadRequestException('Incorrect OTP code');
    }

    // Clear OTP after successful verify
    this.otpCache.delete(input.phone);

    // Fetch user or auto-register user?
    // According to specification: roles exist, let's see if the user exists.
    let user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
      include: { memberProfile: true }
    });

    if (!user) {
      // If user does not exist, return a response signaling profile creation is required
      return {
        isNewUser: true,
        phone: input.phone,
        message: 'OTP verified. Profile creation required.'
      };
    }

    if (user.role === Role.MEMBER && user.memberProfile && user.memberProfile.status === 'SUSPENDED') {
      throw new UnauthorizedException('Your membership has been suspended. Please contact admin.');
    }

    const tokens = await this.generateTokenResponse(user);
    return {
      isNewUser: false,
      ...tokens
    };
  }

  private async generateTokenResponse(user: any) {
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
}

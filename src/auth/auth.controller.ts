import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { 
  EmailLoginSchema, 
  OtpRequestSchema, 
  OtpVerifySchema, 
  MemberRegisterSchema,
  EmailLoginInput,
  OtpRequestInput,
  OtpVerifyInput,
  MemberRegisterInput
} from '@yuvasena/shared';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new member' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input schema' })
  @ApiResponse({ status: 409, description: 'Email or Mobile number already in use' })
  async register(@Body() body: any) {
    const parseResult = MemberRegisterSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.authService.register(parseResult.data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or suspended account' })
  async login(@Body() body: any) {
    const parseResult = EmailLoginSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.authService.loginWithEmail(parseResult.data);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP for mobile authentication' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  async requestOtp(@Body() body: any) {
    const parseResult = OtpRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.authService.requestOtp(parseResult.data);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify mobile OTP and authenticate' })
  @ApiResponse({ status: 200, description: 'Authentication successful or new user redirection code' })
  async verifyOtp(@Body() body: any) {
    const parseResult = OtpVerifySchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    return this.authService.verifyOtp(parseResult.data);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve currently logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Returns authenticated user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized request' })
  async getMe(@Req() req: any) {
    return req.user;
  }
}

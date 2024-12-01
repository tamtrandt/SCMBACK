import { 
  Body, 
  Controller, 
  Post, 
  HttpCode, 
  HttpStatus, 
  UseGuards, 
  Request, 
  BadRequestException 
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/utils/decorator';
import { LocalAuthGuard } from './passport/local.guard';
import { RegisterUserDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  // Login
  @UseGuards(LocalAuthGuard)
  @Public()
  @Post('login')
  login(@Request() req) {
    return this.authService.login(req.user);
  }

  // Register
  @Public()
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    const result = await this.authService.register(registerUserDto);
    return {
      message: 'Registration successful. Please check your email for verification.',
      result,
    };
  }

  // Email verification
  @Public()
  @Post('verify')
  async verifyEmail(@Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('Verification code is required.');
    }
    const result = await this.authService.verifyEmail(code);
    return { message: 'Email verified successfully', result };
  }

  // Resend verification code
  @Public()
  @Post('resendcode')
  async resendVerificationCode(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required.');
    }
    return await this.authService.resendVerification(email);
  }
}
import { Body, Controller, Post, HttpCode, HttpStatus, UseGuards, Request, Get, BadRequestException, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/utils/decorator';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './passport/local.guard';
import { MailerService } from '@nestjs-modules/mailer';
import { RegisterUserDto } from './dto/register.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}


// Đăng nhập
@UseGuards(LocalAuthGuard)
@Public()
@Post('login')
login(@Request() req) {
    return this.authService.login(req.user);
}










// Đăng ký
@Public()
@Post('register')
async register(@Body() registerUserDto: RegisterUserDto) {
  const result = await this.authService.register(registerUserDto);
  return {
    message: 'Registration successful. Please check your email for verification.',
    result,
  };
}
// Xác thực email
@Public()
@Post('verify')
async verifyEmail(@Body('code') code: string) {
  if (!code) {
    throw new BadRequestException('Verification code is required');
  }
  const result = await this.authService.verifyEmail(code);
  return { message: 'Email verified successfully', result };
}

 // Endpoint resend verification code
 @Public()
 @Post('resendcode')
 async resendVerificationCode(@Body('email') email: string) {
   if (!email) {
     throw new BadRequestException('Email is required.');
   }
   return await this.authService.resendVerification(email);
 }
}
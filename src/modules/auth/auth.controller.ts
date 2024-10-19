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
async login(@Body() body: { email: string; password: string }, @Res() res: Response) {
    const user = await this.authService.validateUser(body.email, body.password);
    
    // Kiểm tra tài khoản
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isactive) {
        return res.status(403).json({ message: 'Account is not activated' });
    }

    // Tạo access token
    const accessToken = await this.authService.login(user);
    return res.json({ access_token: accessToken, role: user.role });
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
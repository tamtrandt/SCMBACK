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
@UseGuards(LocalAuthGuard) // Guard xử lý xác thực local trước khi vào hàm này
  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res() res: Response) {
    const { email, password } = body;

    // Kiểm tra trạng thái tài khoản và thực hiện xác thực
    const user = await this.authService.checkAccountStatus(email);
     // Gọi authService.login và lấy access_token
  const result = await this.authService.login(email, password);
    // Thiết lập cookie với access_token
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000,
   
  });

    // // Bạn có thể thêm nhiều cookie nếu cần thiết
    res.cookie('userInfo', JSON.stringify({
      email: user.email,
      userId: user.user_id,
      username: user.username,
      role: user.role
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
    });

    // Trả về kết quả thành công
    return res.send({ message: 'Login successful' });
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
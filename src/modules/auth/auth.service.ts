import { Injectable, Dependencies, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { comparePasswords } from 'src/utils/bcrypass';
import { RegisterUserDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';

@Injectable()
export class AuthService {
  private sessions: { [key: string]: { accessToken: string; userInfo: any } } = {}; // Định nghĩa session in-memory

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly mailerService: MailerService
  ) {}

  // Hàm validate người dùng khi đăng nhập
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email); // Tìm user qua email
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;  // Trả về user nhưng không có password
    }
    return null;
  }

  // Hàm trả về JWT khi người dùng đăng nhập thành công
  // async login(email: string, password: string) {
  //   const user = await this.checkAccountStatus(email);

  //   // Kiểm tra mật khẩu
  //   const isPasswordValid = await comparePasswords(password, user.password);
  //   if (!isPasswordValid) {
  //     throw new BadRequestException('Invalid email or password.');
  //   }

  //   const payload = { email: user.email, sub: user.user_id, role: user.role };
  //   const access_token = this.jwtService.sign(payload);

  //       // Lưu token và thông tin người dùng vào session in-memory
  //       this.saveToSession(user.user_id, access_token, user);

  //   return {
  //     user: { email: user.email, userid: user.user_id, username: user.username, role: user.role },
  //     access_token: this.jwtService.sign(payload),
  // };
  // }
  async login(email: string, password: string): Promise<{ access_token: string }> {
    const user = await this.checkAccountStatus(email);
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password.');
    }

    const payload = { email: user.email, sub: user.user_id, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return { access_token }; // Trả về access token
  }

  //Session
  private saveToSession(userId: string, accessToken: string, userInfo: any) {
    // Lưu thông tin vào session in-memory
    this.sessions[userId] = { accessToken, userInfo };
  }

  getSession(userId: string) {
    return this.sessions[userId]; // Hàm để lấy thông tin session
  }



  async register(registerUserDto: RegisterUserDto): Promise<any> {
    const { email, username, password, phone, address } = registerUserDto;

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo mã xác nhận
    const code_id = uuidv4();
    const code_expired = new Date();
    code_expired.setMinutes(code_expired.getMinutes() + 5); 

    // Tạo người dùng mới
    const newUser = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
      phone,
      address,
      isactive: false,
      code_id,
      code_expired,
    });

    // Lưu người dùng vào cơ sở dữ liệu
    await this.userRepository.save(newUser);

    // Gửi email xác nhận
    await this.mailerService
    .sendMail({
      to: 'finalproject6886@gmail.com', // list of receivers
      from: 'noreply@nestjs.com', // sender address
      subject: 'Testing Nest MailerModule ✔', // Subject line
      text: 'welcome', // plaintext body
      template: "register",
      context: {
        username: newUser?.username  ?? newUser.email,
        verificationCode: code_id,
      }
      
    });
    

    return { message: 'User registered successfully. Please check your email for verification.' };
  }

  //Resend Email

  async resendVerification(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
  
    if (!user) {
      throw new BadRequestException('User not found.');
    }
  
    user.code_id = uuidv4();
    user.code_expired = new Date(Date.now() + 5 * 60 * 1000);
    await this.userRepository.save(user);
  
    // Gửi email xác nhận
    await this.mailerService
    .sendMail({
      to: 'finalproject6886@gmail.com', // list of receivers
      from: 'noreply@nestjs.com', // sender address
      subject: 'Resend for active your account ✔', // Subject line
      text: 'welcome', // plaintext body
      template: "register",
      context: {
        username: user?.username  ?? user.email,
        verificationCode: user.code_id,
      }
      
    });
    return { message: 'Verification code sent again!!! Please check your mail.' };
  }
  

  async verifyEmail(code: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { code_id: code } });

    if (!user) {
      throw new BadRequestException('Invalid verification code.');
    }

    if (user.code_expired < new Date()) {
      throw new BadRequestException('Verification code expired.');
    }

    user.isactive = true;
    user.code_id = null;
    user.code_expired = null;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully.' };
  }

  async checkAccountStatus(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!user.isactive) {
      throw new BadRequestException('Account not verified.');
    }

    return user;
  }



}
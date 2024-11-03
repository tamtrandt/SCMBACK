import { Injectable, Dependencies, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly mailerService: MailerService
  ) {}

// Hàm validate người dùng khi đăng nhập
async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email); 
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;  
    }
    return null;
}


async login(user: any) {
    const payload = { email: user.email, sub: user.user_id, role: user.role, 
    isactive: user.isactive,username: user.username };
    return {
      user:{
        email: user.email,
        sub: user.user_id,
        role: user.role,
        isactive: user.isactive,
      },
      access_token: this.jwtService.sign(payload),
    }; 
}

async register(registerUserDto: RegisterUserDto): Promise<any> {
    const { email, username, password, phone, address } = registerUserDto;
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const code_id = uuidv4();
    const code_expired = new Date();
    code_expired.setMinutes(code_expired.getMinutes() + 5); 

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

    await this.userRepository.save(newUser);

    await this.mailerService
    .sendMail({
      //to: newUser.email, 
      to:"tamyxzt@gmail.com",
      from: 'adhartbayer@gmail.com', 
      subject: 'Verify Code for Register Your Account ✔', 
      text: 'WELCOME', 
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

    await this.mailerService
    .sendMail({
      //to: user.email, 
      to:"tamyxzt@gmail.com",
      from: 'adhartbayer@gmail.com', 
      subject: 'Resend for Active your account ✔', 
      text: 'welcome', 
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
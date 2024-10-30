import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { hashPassword } from 'src/utils/bcrypass';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  private async checkEmailExists(email: string): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    
    await this.checkEmailExists(createUserDto.email);

    
    const hashedPassword = await hashPassword(createUserDto.password);

    let isactive: boolean;
    if (createUserDto.role === 'admin') {
        isactive = true;
    } else if (createUserDto.role === 'customer') {
        isactive = false;
    }

    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,  
      isactive
    });

    
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ user_id: id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUser(id: string, updateUserDto: Partial<CreateUserDto>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.userRepository.save(user);
  }

  async removeUser(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected > 0; 
  }

  
  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }
  
  
}

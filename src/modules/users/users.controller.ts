import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, HttpException, HttpStatus, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/passport/jwt.guard';
import { Public } from 'src/utils/decorator';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}


  @Public()
  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.createUser(createUserDto);
      return { message: 'User created successfully', user };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Public()
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Public()
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const updatedUser = await this.userService.updateUser(id, updateUserDto);
    if (!updatedUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'User updated successfully', updatedUser };
  }
  @Public()
@Delete(':id')
async remove(@Param('id') id: string) {
  const isDeleted = await this.userService.removeUser(id); 
  if (!isDeleted) {
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }
  return { message: 'User deleted successfully' };
}


}

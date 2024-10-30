import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsPhoneNumber, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsOptional() 
  @IsString({ message: 'Username must be a string' })
  username: string;

  @IsOptional() 
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsOptional() 
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}/, {
    message: 'Password must contain at least one letter, one number, and one special character',
  })
  password: string;

  @IsOptional() 
  @IsPhoneNumber('VN', { message: 'Invalid phone number' })
  phone: string;

  @IsOptional() 
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @IsOptional()
  @IsString()
  role: string;
}

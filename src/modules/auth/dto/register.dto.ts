
import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, IsPhoneNumber } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username can be at most 20 characters long' })
  username: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber('VN', { message: 'Invalid phone number' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Address is required' })
  address: string;
}

import { IsEmail, IsNotEmpty, IsString, MinLength, Matches, IsPhoneNumber, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Username is required' })
  @IsString({ message: 'Username must be a string' })
  username: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}/, {
    message: 'Password must contain at least one letter, one number, and one special character',
  })
  password: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsPhoneNumber(null, { message: 'Invalid phone number' })
  phone: string;

  @IsOptional() 
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @IsOptional()
  @IsString()
  role: string;
}



import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, IsOptional, Allow } from 'class-validator';

export class UpdateProductDto {

  @IsString()
  id: string;
  @IsOptional()
  @IsString() 
  name: string;

  @IsOptional() 
  @IsString()
  description: string;

  @IsOptional() 
  @Type(() => Number) // Chuyển đổi từ string sang number
  price: number;
  @IsOptional() 
  @Type(() => Number) // Chuyển đổi từ string sang number
  quantity: number;

  @IsOptional() 
  @IsString()
  brand: string;

  @IsOptional() 
  @IsString()
  category: string;
  @IsOptional() 
  @IsString()
  size: string;
  @IsOptional() 
  @IsString()
  status: string = 'available';
  @Allow()
  imagecids: string[];
  @Allow()
  filecids: string[];
  @Allow() // Bỏ qua kiểm tra cho thuộc tính này
  newFiles: Express.Multer.File[];
}


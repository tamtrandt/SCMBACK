

import { Type } from 'class-transformer';
import { Allow, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @Allow()
  id: string;
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number) // Chuyển đổi từ string sang number
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number) // Chuyển đổi từ string sang number
  quantity: number;
  @IsNotEmpty()
  @IsString()
  brand: string;
  @IsNotEmpty()
  @IsString()
  category: string;
  @IsNotEmpty()
  @IsString()
  size: string;


  @Allow() // Bỏ qua kiểm tra cho thuộc tính này
  files: Express.Multer.File[];
}

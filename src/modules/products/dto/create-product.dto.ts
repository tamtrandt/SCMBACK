

import { Type } from 'class-transformer';
import { Allow, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @Allow()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number) 
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number) 
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

  @Allow()
  status: string;

  @Allow() 
  files: Express.Multer.File[];
}

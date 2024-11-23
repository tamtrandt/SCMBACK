

import { Type } from 'class-transformer';
import { IsString, IsOptional, Allow, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  id: number;
  @IsOptional()
  @IsString() 
  name: string;

  @IsOptional() 
  @IsString()
  description: string;

  @IsOptional() 
  @Type(() => Number) 
  price: number;

  @IsOptional() 
  @Type(() => Number) 
  quantity: number;

  @IsOptional() 
  brand: string;

  @IsOptional() 
  category: string;

  @IsOptional() 
  size: string;

  @IsOptional() 
  status: string = 'available';

  @Allow()
  imagecids: string[];

  @Allow()
  filecids: string[];

  @Allow() 
  newFiles: Express.Multer.File[];
}

export class UpdatePriceDto {
  @IsString()
  @IsNotEmpty()
  price: string;
}

export class UpdateQuantityDto {
  @IsNumber()
  @IsNotEmpty()
  quantity: number ;
}
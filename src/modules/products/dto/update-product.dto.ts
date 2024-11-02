

import { IsString, IsNumber, IsArray } from 'class-validator';

export class UpdateProductDto {

  @IsString()
  id: string;
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsString()
  brand: string;

  @IsString()
  category: string;

  @IsString()
  size: string;

  @IsString()
  status: string;

  @IsString()
  store: string;

  @IsArray()
  imagecids: string[];
  @IsArray()
  filecids: string[];
}


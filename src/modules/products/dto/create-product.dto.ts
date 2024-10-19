import { IsString, IsNumber, IsArray, IsOptional, Min, Max } from 'class-validator';

export class CreateProductDto {
  @IsString()
  product_name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0) // Giá trị nhỏ nhất là 0
  @Max(99999999.99) // Giới hạn cho price
  price: number;

  @IsNumber()
  quantity: number;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsOptional()
  files?: string[];
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { Public } from 'src/utils/decorator';
import { ethers } from 'ethers';
import { Response } from 'express';
import { Product } from './entities/product.entity';
import { ConfigService } from '@nestjs/config';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }
  @Public()
  @Get(':userAddress/cid')
  async getCID(@Param('userAddress') userAddress: string) {
    const cid = await this.productService.getCIDFromBlockchain(userAddress);
    return { cid }; // Trả về CID
  }


  @Public()
  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Public()
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Public()
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.productService.delete(id);
  }
}

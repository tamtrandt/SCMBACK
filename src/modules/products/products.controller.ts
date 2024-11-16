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
  UseInterceptors,
  UploadedFiles,
  ParseArrayPipe,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { Public } from 'src/utils/decorator';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DataProductOnchain } from '../blockchain/interfaces/productsc';
import { Product } from './entities/product.entity';


@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}
  
  @Public()
  @Post()
  @UseInterceptors(FilesInterceptor('files')) 
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],   
  ): Promise<any> {
   
    return this.productService.create(createProductDto,files );
  }
  @Public()
  @Put('update/:id')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto,
  @UploadedFiles() newFiles: Express.Multer.File[], ) {
    try {
      
     const data =  await this.productService.updateProduct(
        id,
        updateProductDto.name,
        updateProductDto.description,
        updateProductDto.price,
        updateProductDto.quantity,
        updateProductDto.brand,
        updateProductDto.category,
        updateProductDto.size,
        updateProductDto.status,
        updateProductDto.imagecids,
        updateProductDto.filecids,
        newFiles
      );

      return data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw new Error('Failed to update product'); 
    }
  }

  @Public()
   @Get('onchain/:id') 
   async getProduct(@Param('id') id: string): Promise<DataProductOnchain> {
       const product = await this.productService.getProductOnChain(id);
       
       if (!product) {
   
           throw new NotFoundException(`Product with ID ${id} not found`);
       }
       
       return product; 
   }
   @Public()
   @Get('onchainall/all') 
    async getAllProducts() {
        try {
            const result = await this.productService.getAllProductOnChain();
            return result; 
        } catch (error) {
            return {
                success: false,
                message: error.message, 
            };
        }
    }

  @Public()
  @Get('offchainall/all')
  async findAll(): Promise<{ count: number; product_ids: string[] }> {
    return await this.productService.findAll(); 
  }

  @Public()
  @Get('offchain/:id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Public()
  @Delete('delete/:id')
  delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }



  















}

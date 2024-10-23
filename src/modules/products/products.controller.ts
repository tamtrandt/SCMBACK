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
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { Public } from 'src/utils/decorator';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductSC } from '../blockchain/interfaces/productsc';


@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post()
  @UseInterceptors(FilesInterceptor('files')) // 'files' là tên của field chứa files trong request
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    return this.productService.create(createProductDto, files);
  }

  @Public()
   // Định nghĩa route để lấy thông tin sản phẩm theo ID
   @Get(':id') // Endpoint sẽ nhận ID sản phẩm từ URL
   async getProduct(@Param('id') id: string): Promise<ProductSC> {
       const product = await this.productService.getProduct(id);
       
       if (!product) {
           // Nếu không tìm thấy sản phẩm, ném lỗi 404
           throw new NotFoundException(`Product with ID ${id} not found`);
       }
       
       return product; // Trả về sản phẩm nếu tìm thấy
   }


 

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Public()
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Public()
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: string) {
    return this.productService.delete(id);
  }
}

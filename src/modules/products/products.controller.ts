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
  @UseInterceptors(FilesInterceptor('files')) // 'files' là tên của field chứa files trong request
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
     // Lấy buffer từ từng tệp
    const buffers = files.map(file => file.buffer); // Lấy buffer của từng file
    return this.productService.create(createProductDto, buffers);
  }

  @Public()
   // Định nghĩa route để lấy thông tin sản phẩm theo ID
   @Get('home/products/:id') // Endpoint sẽ nhận ID sản phẩm từ URL
   async getProduct(@Param('id') id: string): Promise<DataProductOnchain> {
       const product = await this.productService.getProduct(id);
       
       if (!product) {
           // Nếu không tìm thấy sản phẩm, ném lỗi 404
           throw new NotFoundException(`Product with ID ${id} not found`);
       }
       
       return product; // Trả về sản phẩm nếu tìm thấy
   }
   @Public()
   @Get('home/products')
  async getAllProducts() {
    try {
      const result = await this.productService.getAllProducts(); // Gọi service để lấy dữ liệu
      return result; // Trả về kết quả từ service
    } catch (error) {
      return {
        success: false,
        message: error.message, // Trả về lỗi nếu có
      };
    }
  }



  @Public()
   // API lấy tất cả sản phẩm trong DB
   @Get('dashboard/products')
   async findAll(): Promise<Product[]> {
     return await this.productService.findAll(); // Gọi service để lấy tất cả sản phẩm
   }


 

  @Public()
  @Get('dashboard/products/:id')
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

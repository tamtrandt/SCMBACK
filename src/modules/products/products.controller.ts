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
    @UploadedFiles() files: Express.Multer.File[],   // Chỉ định field cho files
  ): Promise<any> {
   
    return this.productService.create(createProductDto,files );
  }
  @Public()
  @Put('update/:id')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto,
  @UploadedFiles() newFiles: Express.Multer.File[], ) {
    try {
      
      await this.productService.updateProduct(
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

      return { message: 'Product updated successfully' };
    } catch (error) {
      console.error('Failed to update product:', error);
      throw new Error('Failed to update product'); // Bạn có thể điều chỉnh lỗi tùy ý
    }
  }

  @Public()
   // Định nghĩa route để lấy thông tin sản phẩm theo ID
   @Get('onchain/:id') // Endpoint sẽ nhận ID sản phẩm từ URL
   async getProduct(@Param('id') id: string): Promise<DataProductOnchain> {
       const product = await this.productService.getProductOnChain(id);
       
       if (!product) {
           // Nếu không tìm thấy sản phẩm, ném lỗi 404
           throw new NotFoundException(`Product with ID ${id} not found`);
       }
       
       return product; // Trả về sản phẩm nếu tìm thấy
   }
   @Public()
   @Get('onchainall/all') // Đặt endpoint
    async getAllProducts() {
        try {
            const result = await this.productService.getAllProductOnChain(); // Gọi service để lấy dữ liệu
            return result; // Trả về kết quả từ service
        } catch (error) {
            return {
                success: false,
                message: error.message, // Trả về lỗi nếu có
            };
        }
    }

  @Public()
  // API lấy tổng số sản phẩm và danh sách product_id trong DB
  @Get('offchainall/all')
  async findAll(): Promise<{ count: number; product_ids: string[] }> {
    return await this.productService.findAll(); // Gọi service để lấy số lượng và danh sách ID sản phẩm
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

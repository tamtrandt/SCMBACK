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
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { Public } from 'src/utils/decorator';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { DataProductOnchain } from '../blockchain/interfaces/productsc';
import { Product } from './entities/product.entity';
import { AuthGuard } from '@nestjs/passport';
import { WalletAuthGuard } from '../blockchain/ProductContract/wallet/wallet.guard';

// @Controller('products')
// export class ProductController {
//   constructor(private readonly productService: ProductService,
//     private readonly configService: ConfigService,
//   ) {}
  
//   @Public()
//   @Post()
//   @UseInterceptors(FilesInterceptor('files')) 
//   async create(
//     @Body() createProductDto: CreateProductDto,
//     @UploadedFiles() files: Express.Multer.File[],   
//   ): Promise<any> {
   
//     return this.productService.create(createProductDto,files );
//   }
//   @Public()
//   @Put('update/:id')
//   @UseInterceptors(FilesInterceptor('newFiles'))
//   async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto,
//   @UploadedFiles() newFiles: Express.Multer.File[], ) {
//     try {
      
//      const data =  await this.productService.updateProduct(
//         id,
//         updateProductDto.name,
//         updateProductDto.description,
//         updateProductDto.price,
//         updateProductDto.quantity,
//         updateProductDto.brand,
//         updateProductDto.category,
//         updateProductDto.size,
//         updateProductDto.status,
//         updateProductDto.imagecids,
//         updateProductDto.filecids,
//         newFiles
//       );

//       return data;
//     } catch (error) {
//       console.error('Failed to update product:', error);
//       throw new Error('Failed to update product'); 
//     }
//   }

//   @Public()
//    @Get('onchain/:id') 
//    async getProduct(@Param('id') id: string): Promise<DataProductOnchain> {
//        const product = await this.productService.getProductOnChain(id);
       
//        if (!product) {
   
//            throw new NotFoundException(`Product with ID ${id} not found`);
//        }
       
//        return product; 
//    }
//    @Public()
//    @Get('onchainall/all') 
//     async getAllProducts() {
//         try {
//             const result = await this.productService.getAllProductOnChain();
//             return result; 
//         } catch (error) {
//             return {
//                 success: false,
//                 message: error.message, 
//             };
//         }
//     }

//   @Public()
//   @Get('offchainall/all')
//   async findAll(): Promise<{ count: number; product_ids: string[] }> {
//     return await this.productService.findAll(); 
//   }

//   @Public()
//   @Get('offchain/:id')
//   findOne(@Param('id') id: string) {
//     return this.productService.findOne(id);
//   }

//   @Public()
//   @Delete('delete/:id')
//   delete(@Param('id') id: string) {
//     return this.productService.delete(id);
//   }

// }


@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Tạo sản phẩm (yêu cầu WalletToken)
  @UseGuards(WalletAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Request() req, // Lấy thông tin từ JWT
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    const walletAddress = req.user.walletAddress; // Lấy walletAddress từ token
    console.log('Wallet Address:', walletAddress);

    // Pass walletAddress vào ProductService
    return this.productService.create(createProductDto, files, walletAddress);
  }

  // Cập nhật sản phẩm (yêu cầu WalletToken)
  @UseGuards(WalletAuthGuard)
  @Put('update/:id')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() newFiles: Express.Multer.File[],
  ) {
    const walletAddress = req.user.walletAddress;
    console.log('Wallet Address:', walletAddress);

    // Pass walletAddress vào ProductService
    return this.productService.updateProduct(
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
      newFiles,
      walletAddress,
    );
  }

  // Lấy thông tin sản phẩm on-chain (yêu cầu WalletToken)
  @Public()
  @Get('onchain/:id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productService.getProductOnChain(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  // Lấy tất cả sản phẩm on-chain (yêu cầu WalletToken)
  @Public()
  @Get('onchainall/all')
  async getAllProducts() {
    return this.productService.getAllProductOnChain();
  }

  // Lấy tất cả sản phẩm off-chain (yêu cầu WalletToken)
  @Public()
  @Get('offchainall/all')
  async findAll(): Promise<{ count: number; product_ids: string[] }> {
    return await this.productService.findAll();
  }

  // Lấy sản phẩm off-chain theo ID (yêu cầu WalletToken)
  @Public()
  @Get('offchain/:id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // Xóa sản phẩm (yêu cầu WalletToken)
  @Public()
  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}

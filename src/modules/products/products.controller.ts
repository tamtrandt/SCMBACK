import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
  Put,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdatePriceDto, UpdateProductDto, UpdateQuantityDto } from './dto/update-product.dto';
import { ProductService } from './products.service';
import { Public } from 'src/utils/decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { WalletAuthGuard } from '../blockchain/ProductContract/wallet/wallet.guard';
import { SmartContractService } from '../blockchain/ProductContract/smartcontract.service';


@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService,
    private readonly smartContractService: SmartContractService,
  ) {}

  // Tạo sản phẩm (yêu cầu WalletToken)
  @UseGuards(WalletAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Request() req, // Lấy thông tin từ JWT
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    const walletAddress = req.user.walletAddress; 
    // Pass walletAddress vào ProductService
    return this.productService.create(createProductDto, files, walletAddress);
  }




  // Cập nhật sản phẩm (yêu cầu WalletToken)
  @UseGuards(WalletAuthGuard)
  @Put('update/:id/metadata')
  @UseInterceptors(FilesInterceptor('newFiles'))
  async update(
    @Request() req,
    @Param('id') id: number,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() newFiles: Express.Multer.File[],
  ) {
    const walletAddress = req.user.walletAddress;
    // Pass walletAddress vào ProductService
    return this.productService.updateMetadata(
      id,
      updateProductDto.name,
      updateProductDto.description,
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


  // Update Price
  @UseGuards(WalletAuthGuard)
  @Patch('update/:id/price')
  async updatePrice(
    @Request() req,
    @Param('id') id: number,
    @Body() body: UpdatePriceDto, 
  ) {
    // Lấy địa chỉ ví từ yêu cầu của người dùng đã đăng nhập
    const walletAddress = req.user.walletAddress;
      // Gọi service để cập nhật giá sản phẩm
      const success = await this.productService.updateProductPrice(id, body.price, walletAddress);
      // Nếu cập nhật thành công
      if (success) {
        return { message: 'OK' }; // Trả về thông báo thành công
      } else {
        throw new Error('Price update failed'); // Nếu có lỗi, throw lỗi
      }
  }

  //Update Quantity
  @UseGuards(WalletAuthGuard)
  @Patch('update/:id/quantity')
  async updateQuantity(
    @Request() req,
    @Param('id') id: number,
    @Body() body: UpdateQuantityDto, 
  ) {
    const walletAddress = req.user.walletAddress;
      const hash = await this.productService.updateProductQuantity(id, body.quantity, walletAddress);
      return { hash };
  }


  // Lấy tất cả sản phẩm on-chain (yêu cầu WalletToken)

  @Public()
  @Get('onchain/:tokenId')
  async getProductDetails(@Param('tokenId') tokenId: number) {
    try {
      // Call getProductInfo from SmartContractService to get the details
      const productDetails = await this.productService.getProductDetails(tokenId);
      // Return the product details
      return {
        success: true,
        data: productDetails,
      };
    } catch (error) {
      // Handle the error appropriately
      console.error('Error fetching product details:', error);
      throw new NotFoundException('Product not found or contract interaction failed');
    }
  }

  @Public()
  @Get('onchainall/all')
  async getAllProducts() {
    return this.productService.getAllProductOnChain();
  }

  // Lấy tất cả sản phẩm off-chain (yêu cầu WalletToken)
  @Public()
  @Get('offchainall/all')
  async findAll(): Promise<{ count: number; product_ids: number[] }> {
    return await this.productService.findAll();
  }
  

  // Lấy sản phẩm off-chain theo ID (yêu cầu WalletToken)
  @Public()
  @Get('offchain/:id')
  async findOne(@Param('id') id: number) {
    return this.productService.getAllCIDs(id);
  }
  @Public()
  @Get('offchain2/:id')
  async findOn1e(@Param('id') id: number) {
    return this.smartContractService.getAllCIDs(id);
  }

  // Xóa sản phẩm (yêu cầu WalletToken)
  @UseGuards(WalletAuthGuard)
  @Delete('delete/:id')
  async delete( @Request() req, @Param('id') id: number) {
    const walletAddress = req.user.walletAddress;
    const result = await this.productService.delete(id, walletAddress);

    // Trả về phản hồi dạng JSON
    return {
      success: result,
      message: result ? 'Product deleted successfully' : 'Failed to delete product',
  }
};

@Public()
@Get('balance/:walletAddress/:tokenId')
async getTokenBalance(
  @Param('walletAddress') walletAddress: string, // Địa chỉ ví
  @Param('tokenId') tokenId: number, // TokenId cần kiểm tra
): Promise<number> {
  try {
    const balance = await this.smartContractService.getTokenBalance(walletAddress, tokenId);
    return balance; // Trả về số dư token
  } catch (error) {
    console.error('Error fetching token balance:', error);
    throw error;
  }
}

@UseGuards(WalletAuthGuard)
@Post('test')
async setApprovalForAll(
  @Request() req,
  @Body('operator') operator: string,
  @Body('approved') approved: boolean,
): Promise<{ transactionHash: string }> {
  const walletAddress = req.user.walletAddress;
  const transactionHash = await this.smartContractService.setApprovalForAll(operator, approved);
  return { transactionHash };
}

}

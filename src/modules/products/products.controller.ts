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
  constructor(
    private readonly productService: ProductService,
    private readonly smartContractService: SmartContractService,
  ) {}

  @UseGuards(WalletAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Request() req,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<any> {
    const walletAddress = req.user.walletAddress;
    return this.productService.create(createProductDto, files, walletAddress);
  }

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

  @UseGuards(WalletAuthGuard)
  @Patch('update/:id/price')
  async updatePrice(
    @Request() req,
    @Param('id') id: number,
    @Body() body: UpdatePriceDto,
  ) {
    const walletAddress = req.user.walletAddress;
    const success = await this.productService.updateProductPrice(id, body.price, walletAddress);
    if (success) {
      return { message: 'OK' };
    } else {
      throw new Error('Price update failed');
    }
  }

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

  @Public()
  @Get('onchain/:tokenId')
  async getProductDetails(@Param('tokenId') tokenId: number) {
    try {
      const productDetails = await this.productService.getProductDetails(tokenId);
      return { success: true, data: productDetails };
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new NotFoundException('Product not found or contract interaction failed');
    }
  }

  @Public()
  @Get('onchainall/all')
  async getAllProducts() {
    return this.productService.getAllProductOnChain();
  }

  @Public()
  @Get('offchainall/all')
  async findAll(): Promise<{ count: number; product_ids: number[] }> {
    return await this.productService.findAll();
  }

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

  @UseGuards(WalletAuthGuard)
  @Delete('delete/:id')
  async delete(@Request() req, @Param('id') id: number) {
    const walletAddress = req.user.walletAddress;
    const result = await this.productService.delete(id, walletAddress);
    return {
      success: result,
      message: result ? 'Product deleted successfully' : 'Failed to delete product',
    };
  }

  @Public()
  @Get('balance/:walletAddress/:tokenId')
  async getTokenBalance(
    @Param('walletAddress') walletAddress: string,
    @Param('tokenId') tokenId: number,
  ): Promise<number> {
    try {
      return await this.smartContractService.getTokenBalance(walletAddress, tokenId);
    } catch (error) {
      console.error('Error fetching token balance:', error);
      throw error;
    }
  }

  @UseGuards(WalletAuthGuard)
  @Post('buy')
  async buyTokens(
    @Request() req,
    @Body('tokenIds') tokenIds: number[],
    @Body('amounts') amounts: number[],
    @Body('totalPrice') totalPrice: string,
    @Body('email') email: string,
  ) {
    const walletAddress = req.user.walletAddress;
    await this.productService.buyTokens(tokenIds, amounts, totalPrice,email, walletAddress);
    return { message: 'Tokens purchased successfully' };
  }
}
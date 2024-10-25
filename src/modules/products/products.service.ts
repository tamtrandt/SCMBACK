import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ThirdwebStorage } from '@thirdweb-dev/storage'; 
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid'; 
import { ProductSC } from '../blockchain/interfaces/productsc';
import { SmartContractService } from '../blockchain/ProductContract/smartcontract.service';



@Injectable()
export class ProductService {
//Khoi tao storage
  private storage = new ThirdwebStorage();
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
    private readonly smartContractService: SmartContractService,
  ) {
  // Dung Dich Vu IPFS cua thirdweb
  const apiKey = this.configService.get<string>('THIRDWEB_API_KEY');
  this.storage = new ThirdwebStorage({ secretKey: apiKey });
  }

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ): Promise<any> {
    //Generate ID
    const generatedId = uuidv4();
 // Array to store CIDs and QR codes for each file
 const cids = [];
 const qrCodes = [];

 // Upload each file individually to IPFS and generate QR code for each CID
 for (const file of files) {
    // Tải tệp lên IPFS và nhận CID
    const cid = await this.storage.upload(file); 
    cids.push(cid);
    // Lấy URL từ CID
    const { url } = await this.storage.download(cid); 
    console.log('URL:', url); // Đây là URL của tệp được tải lên

    // Tạo mã QR cho URL và lưu dưới dạng Data URL
    const qrCode = await QRCode.toDataURL(url); 
    qrCodes.push(qrCode);
   
 }

   
    // Gọi smart contract để lưu sản phẩm và nhận về block hash
    const transactionkHash = await this.smartContractService.addProduct(
      generatedId,
      createProductDto.name,
      createProductDto.description,
      createProductDto.price,
      createProductDto.quantity,
      createProductDto.status,
      cids, // CID của folder chứa các files trên IPFS
  );

  // Lưu thông tin cơ bản về sản phẩm vào PostgreSQL, không lưu files
  const newProduct = this.productRepository.create({
      id: generatedId,
      transactionHash: transactionkHash,
      qrcode: qrCodes,
      isDeleted: false, 
      create_at: new Date(),
      update_at: new Date(),
      
  });

    return await this.productRepository.save(newProduct);
  }


   // Gọi hàm getProduct từ SmartContractService
   async getProduct(id: string): Promise<ProductSC> {
    return this.smartContractService.getProduct(id);
   }
  

async getAllProducts() {
  try {
    const products = await this.smartContractService.getAllProducts();
    return {
      success: true,
      data: products,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}


  
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

// Hàm tìm kiếm tất cả sản phẩm
async findAll(): Promise<Product[]> {
  return await this.productRepository.find(); // Trả về tất cả sản phẩm từ database
}



  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    await this.findOne(id); // Kiểm tra sản phẩm tồn tại
    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<string> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return  "This Product Not Available anymore. ";
  }
}
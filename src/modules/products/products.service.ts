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
import { DataProductOnchain } from '../blockchain/interfaces/productsc';
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

   // Helper function to convert price to string format
 private priceToString(price: number): string {
  return price.toFixed(2); // Convert to string with two decimal places
}

  async create(
    createProductDto: CreateProductDto,
    buffers: Buffer[],
  ): Promise<any> {
    //Generate ID
    const generatedId = uuidv4();
 // Array to store CIDs and QR codes for each file
 const cids = [];
 const qrCodes = [];

 // Upload each buffer individually to IPFS and generate QR code for each CID
 for (const buffer of buffers) {
  // Tải tệp lên IPFS và nhận CID
  const cid = await this.storage.upload(buffer); // Giả sử upload hỗ trợ buffer
  cids.push(cid);
  
  // Lấy URL từ CID
  const { url } = await this.storage.download(cid);
  console.log('URL:', url); // Đây là URL của tệp được tải lên

  // Tạo mã QR cho URL và lưu dưới dạng Data URL
  const qrCode = await QRCode.toDataURL(url);
  qrCodes.push(qrCode);
}

   const priceString = this.priceToString(createProductDto.price);
   
   // Call smart contract to save the product and get back the block hash
   const transactionHash = await this.smartContractService.addProduct(
    generatedId,
    createProductDto.name,
    createProductDto.description,
    priceString,
    createProductDto.quantity,
    createProductDto.brand,
    createProductDto.category, // Thêm brand từ DTO
    createProductDto.size, // Thêm size từ DTO
   'available',
   'onchain',
    cids, // CIDs of the files on IPFS
  );

  // Lưu thông tin cơ bản về sản phẩm vào PostgreSQL, không lưu files
  const newProduct = this.productRepository.create({
      id: generatedId,
      transactionHash: transactionHash,
      qrcode: qrCodes,
      isDeleted: false, 
      store: "offchain",
      create_at: new Date(),
      update_at: new Date(),
      
  });

    return await this.productRepository.save(newProduct);
  }


   // Gọi hàm getProduct từ SmartContractService
   async getProductOnChain(id: string): Promise<DataProductOnchain> {
    return this.smartContractService.getProduct(id);
   }
//Update On Chain
async updateProduct(
  id: string,
  name: string,
  description: string,
  price: number,
  quantity: number,
  brand: string,
  category: string,
  size: string,
  status: string,
  store:string,
  cids: string[]
): Promise<void> {
  await this.smartContractService.updateProduct(id, name, description, price, quantity, brand, category, size, status,store, cids);
}
  
//Get All On Chain
async getAllProductOnChain() {
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
async findAll(): Promise<{ count: number; product_ids: string[] }> {
  const products = await this.productRepository.find(); // Lấy tất cả sản phẩm từ database
  
  const count = products.length; // Đếm tổng số sản phẩm
  const product_ids = products.map(product => product.id); // Lấy danh sách product_id từ các sản phẩm

  return { count, product_ids }; // Trả về đối tượng bao gồm count và mảng product_ids
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
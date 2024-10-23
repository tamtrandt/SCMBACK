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
    // Upload nhiều files lên Thirdweb IPFS dưới dạng một folder
    const ipfsFolderCid = await this.storage.upload(files);
    //const ipfsFolderCid = 'QmNMbC38Pauhp6QeZNrT4Kz1AFfjdLiZiCXZgJZrPRNWqK';

    const ipfsFolderUrl = this.storage.resolveScheme(ipfsFolderCid); // Lấy URL của folder
    //Tao QR tu URL
    const qrCodeDataUrl = await QRCode.toDataURL(ipfsFolderUrl);

   
    // Gọi smart contract để lưu sản phẩm và nhận về block hash
    const transactionkHash = await this.smartContractService.addProduct(
      generatedId,
      createProductDto.name,
      createProductDto.description,
      createProductDto.price,
      createProductDto.quantity,
      createProductDto.status,
      ipfsFolderCid // CID của folder chứa các files trên IPFS
  );

  // Lưu thông tin cơ bản về sản phẩm vào PostgreSQL, không lưu files
  const newProduct = this.productRepository.create({
      id: generatedId,
      transactionHash: transactionkHash,
      qrcode: qrCodeDataUrl,
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
  // // Lấy thông tin sản phẩm từ database
  // async getProduct(id: string): Promise<Product> {
  //   // Lấy sản phẩm từ PostgreSQL
  //   return this.productRepository.findOne({ where: { id } });
  // }



  
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
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
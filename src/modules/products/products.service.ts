import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ThirdwebStorage } from '@thirdweb-dev/storage'; // 
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as StorageContract    from '../abis/Storage.json';


@Injectable()
export class ProductService {
//Khoi tao storage
  private storage = new ThirdwebStorage();
  private contract: ethers.Contract;
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
  ) {

  // Dung Dich Vu IPFS cua thirdweb
  const apiKey = this.configService.get<string>('THIRDWEB_API_KEY');
  this.storage = new ThirdwebStorage({ secretKey: apiKey });
  //Connect Smart Contract
  // Khởi tạo kết nối đến smart contract
  const rpcUrl = this.configService.get<string>('RPC_URL');
  const privateKey = this.configService.get<string>('PRIVATE_KEY');
  const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

 // Thiết lập provider và wallet
 const provider = new ethers.providers.JsonRpcProvider(rpcUrl); // Sử dụng JsonRpcProvider
 const wallet = new ethers.Wallet(privateKey, provider);

  // Kết nối với hợp đồng
  this.contract = new ethers.Contract(contractAddress, StorageContract.abi, wallet);


 
  

  

  }

 

  async create(createProductDto: CreateProductDto): Promise<Product> {
   
    // Tạo object chứa thông tin cần upload lên IPFS
    const ipfsData = {
      product_name: createProductDto.product_name,
      description: createProductDto.description,
      images: createProductDto.images,
      files: createProductDto.files,
    };


    // Upload object lên IPFS
    const ipfsUri = await this.storage.upload(ipfsData);
    const ipfsUrl = this.storage.resolveScheme(ipfsUri); 
    console.log(ipfsUrl);// Lấy URL đầy đủ

   
    // Tạo đối tượng product để lưu vào PostgreSQL
    const newProduct = this.productRepository.create({
      ...createProductDto,
      status: 'available', // Gán status mặc định (nếu cần)
      price: createProductDto.price,
      quantity: createProductDto.quantity,   
    });

    newProduct.ipfsUrl = ipfsUrl; 

    // Lưu sản phẩm vào PostgreSQL
    await this.productRepository.save(newProduct);

    // Lưu CID vào smart contract
    await this.storeCIDInBlockchain(ipfsUri);
    return newProduct; // Trả về sản phẩm mới

   
   
    // return this.productRepository.save(newProduct);
 
  }

  // Phương thức để lưu CID vào smart contract
  private async storeCIDInBlockchain(cid: string): Promise<void> {
    const tx = await this.contract.storeCID(cid);
    await tx.wait(); // Chờ cho giao dịch được xác nhận
    console.log(`Stored CID in smart contract: ${cid}`);
  }
  async getCIDFromBlockchain(userAddress: string): Promise<string> {
    const cid = await this.contract.getCID(userAddress);
    return cid; // Trả về CID
  }






















  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    await this.findOne(id); // Kiểm tra sản phẩm tồn tại
    await this.productRepository.update(id, updateProductDto);
    return this.findOne(id);
  }

  async delete(id: number): Promise<string> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return  "This Product Not Available anymore. ";
  }
}
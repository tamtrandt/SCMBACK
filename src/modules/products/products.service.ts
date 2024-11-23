import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
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
    return price.toFixed(2); 
  }
  private generateUniqueId(): number {
    const timestamp = Date.now() % 100000; // Lấy 5 chữ số cuối của timestamp
    const randomSuffix = Math.floor(Math.random() * 1000); // Thêm 3 chữ số ngẫu nhiên
    return parseInt(`${timestamp}${randomSuffix}`);
}

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[], // Các file được upload
    walletAddress: string, // Địa chỉ ví của người tạo sản phẩm
  ): Promise<any> {
    // Generate token ID (unique ID for the product)
    const tokenId = this.generateUniqueId();
  
    // Phân loại file (image và các file khác)
    const images = files.filter((file) => file.mimetype.startsWith('image/'));
    const otherFiles = files.filter((file) => !file.mimetype.startsWith('image/'));
    const imageCIDs = await this.GetCids(images); // Lấy CID của các hình ảnh
    const fileCIDs = await this.GetCids(otherFiles); // Lấy CID của các file khác
  
    // Tạo metadata cho sản phẩm
    const productMetadata = {
      id: tokenId,
      name: createProductDto.name,
      description: createProductDto.description,
      brand: createProductDto.brand,
      category: createProductDto.category,
      size: createProductDto.size,
      imagecids: imageCIDs, // CID của hình ảnh
      filecids: fileCIDs,   // CID của các file
      creater: walletAddress, // Địa chỉ ví của người tạo
    };
  
    // Upload metadata lên IPFS
    const metadataCID = await this.storage.upload(productMetadata);
    const metadataResponse = await this.storage.download(metadataCID);
    const metadataURL = metadataResponse.url;
    console.log('Uploaded metadata CID:', metadataURL);
  
    // Đặt ví cho backend
    this.smartContractService.setWalletAddress(walletAddress);
  
    // Chuyển giá sang dạng string và lấy các tham số khác
    const priceString = this.priceToString(createProductDto.price); // Chuyển giá thành string
    const amount = createProductDto.quantity; // Tổng số lượng mint
    const quantity = createProductDto.quantity; // Số lượng tồn kho
    const status = 'available'; // Trạng thái mặc định
  
    try {
      // Gọi hàm mintProduct từ smart contract
      const transactionHash = await this.smartContractService.mintProduct(
        tokenId,
        amount,
        metadataURL,
        priceString,
        quantity,
        status,
      );
  
      // Tạo mã QR cho file và hình ảnh
      const qrCodes = [];
      const fileQRCodes = await this.generateQRCodesFromCIDs(fileCIDs);
      qrCodes.push(...fileQRCodes);
      const imageQRCodes = await this.generateQRCodesFromCIDs(imageCIDs);
      qrCodes.push(...imageQRCodes);
  
      // Lưu thông tin sản phẩm vào cơ sở dữ liệu PostgreSQL
      const newProduct = this.productRepository.create({
        id: tokenId,
        transactionHash: transactionHash,
        create_at: new Date(),
        qrcode: qrCodes, // Mã QR cho các file và hình ảnh
      });
  
      // Lưu vào cơ sở dữ liệu
      return await this.productRepository.save(newProduct);
    } catch (error) {
      console.error('Error minting product or saving to database:', error);
      throw new Error('Failed to create product');
    }
  }

  // Gọi hàm getProduct từ SmartContractService
  async getProductDetails(tokenId: number): Promise<{
    tokenId: number;
    metadata: string;
    price: string;
    quantity: number;
    status: string;
    owner: string;
  }> {
    try {
      const productInfo = await this.smartContractService.getProductInfo(tokenId);
      return {
        tokenId,
        ...productInfo, // Bao gồm price, quantity, status, owner
      };
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Unable to fetch product details from blockchain.');
    }
  }
  // Get All Product
  async getAllProductOnChain() { 
    return await this.smartContractService.getAllTokenIds(); }

  // Tạo một hàm riêng để xử lý việc upload và lấy CID
  private GetCids = async (files: Express.Multer.File[]): Promise<string[]> => {
    const cids: string[] = [];
    for (const file of files) {
      const cid = await this.storage.upload(file.buffer); 
      cids.push(cid);
    }
    return cids;
  };
  // Hàm để chuyển đổi CIDs thành URLs và tạo QR codes
  private generateQRCodesFromCIDs = async (cids: string[]): Promise<string[]> => {
    const qrCodes: string[] = [];
    for (const cid of cids) {
      const { url } = await this.storage.download(cid); 
      const qrCode = await QRCode.toDataURL(url);
      qrCodes.push(qrCode);
    }
    return qrCodes;
  };

  //Update On Chain
  async updateMetadata(
    id: number, 
    name: string,
    description: string,
    price: number,
    quantity: number,
    brand: string,
    category: string,
    size: string,
    status: string,
    imagecids: string[],
    filecids: string[],
    newFiles: Express.Multer.File[],
    walletAddress: string, // Thêm walletAddress
  ): Promise<any> {
    try {
      const qrCodes = []; 
      const images = newFiles.filter(file => file.mimetype.startsWith('image/'));
      const otherFiles = newFiles.filter(file => !file.mimetype.startsWith('image/'));

      // Upload hình ảnh và các tệp khác
      const uploadedImageCids = await this.GetCids(images);
      const uploadedFileCids = await this.GetCids(otherFiles);
      // Đảm bảo imagecids là một mảng hoặc chuyển đổi thành mảng nếu nó không phải là mảng
      if (imagecids === undefined) {
        imagecids = [];
      } else if (!Array.isArray(imagecids)) {
        imagecids = [imagecids]; 
      }
      if (filecids === undefined) {
        filecids = [];
      } else if (!Array.isArray(filecids)) {
        filecids = [filecids]; 
      }

      // Gộp các CIDs mới vào danh sách hiện tại
      imagecids.push(...uploadedImageCids);
      filecids.push(...uploadedFileCids);
        // Generate QR codes for file CIDs
    const fileQRCodes = await this.generateQRCodesFromCIDs(filecids);
    qrCodes.push(...fileQRCodes);
    const imageQRCodes = await this.generateQRCodesFromCIDs(imagecids);
    qrCodes.push(...imageQRCodes);

     // Gọi hàm setWalletAddress trước khi gọi updateProduct
     this.smartContractService.setWalletAddress(walletAddress);

      const Metadata = {
        id,
        name,
        description,     
        brand,
        category,
        size,
        status,
        imagecids,
        filecids,
      };
      const metadataCID = await this.storage.upload(Metadata);
      const metadataResponse = await this.storage.download(metadataCID);
      const metadataURL = metadataResponse.url;
      console.log('Uploaded metadata CID:', metadataURL);

      const transactionupdat = await this.smartContractService.updateMetadata(id,metadataCID  );

      // Lấy repository của Product
      // Tìm sản phẩm dựa trên id
      const product = await this.productRepository.findOne({ where: { id } });
        
        if (!product) {
            throw new Error(`Product with id ${id} not found`);
        }
       product.transactionHash = transactionupdat; 
       product.qrcode = qrCodes; 
       product.update_at = new Date(); 
       return await this.productRepository.save(product);
     
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error; 
    }
  }


 // Update Price
 // Cập nhật giá sản phẩm
 async updateProductPrice(id: number, price: string, walletAddress: string,): Promise<any> {
  try {
    this.smartContractService.setWalletAddress(walletAddress);
      // Gọi hàm updatePrice từ smart contract service
      const transactionHash = await this.smartContractService.updatePrice(id, price);
      return transactionHash;
  } catch (error) {
      console.error('Error in ProductService updating price:', error);
      throw new Error('Failed to update product price at ProService');
  }
}

// Cập nhật số lượng sản phẩm
async updateProductQuantity(id: number, quantity: number, walletAddress: string,): Promise<any> {
  try {
    this.smartContractService.setWalletAddress(walletAddress);
      // Gọi hàm updateQuantity từ smart contract service
      const transactionHash = await this.smartContractService.updateQuantity(id, quantity);
      return transactionHash;
  } catch (error) {
      console.error('Error in ProductService updating quantity:', error);
      throw new Error('Failed to update product quantity');
  }
}

  









  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }


  async findAll(): Promise<{ count: number; product_ids: number[] }> {
    const products = await this.productRepository.find(); 
    const count = products.length; 
    const product_ids = products.map(product => product.id); 
    return { count, product_ids };
  }


  async delete(id: number): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return result.affected > 0;
  }

























}
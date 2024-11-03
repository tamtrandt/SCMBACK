import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
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
    return price.toFixed(2); 
  }

  async create(
    createProductDto: CreateProductDto,
    files
  ): Promise<any> {
    //Generate ID
    const generatedId = uuidv4();
    // Array to store CIDs and QR codes for each file
    const qrCodes = [];
    const images = files.filter(file => file.mimetype.startsWith('image/'));
    const otherfiles = files.filter(file => !file.mimetype.startsWith('image/'));
    const filecids = await this.GetCids(otherfiles);
    const imagecids = await this.GetCids(images);

    // Generate QR codes for file CIDs
    const fileQRCodes = await this.generateQRCodesFromCIDs(filecids);
    qrCodes.push(...fileQRCodes);
    const imageQRCodes = await this.generateQRCodesFromCIDs(imagecids);
    qrCodes.push(...imageQRCodes);

    const priceString = this.priceToString(createProductDto.price);

    // Call smart contract to save the product and get back the block hash
    const transactionHash = await this.smartContractService.addProduct(
      generatedId,
      createProductDto.name,
      createProductDto.description,
      priceString,
      createProductDto.quantity,
      createProductDto.brand,
      createProductDto.category, 
      createProductDto.size,
      'available',
      imagecids,
      filecids, 
    );

    // Lưu thông tin cơ bản về sản phẩm vào PostgreSQL, không lưu files
    const newProduct = this.productRepository.create({
      id: generatedId,
      transactionHash: transactionHash,
      create_at: new Date(),
      qrcode: qrCodes,
    });
    return await this.productRepository.save(newProduct);
  }


  // Gọi hàm getProduct từ SmartContractService
  async getProductOnChain(id: string): Promise<DataProductOnchain> {
    return this.smartContractService.getProduct(id);
  }

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
    imagecids: string[],
    filecids: string[],
    newFiles: Express.Multer.File[]
  ): Promise<void> {
    try {
      const qrCodes: string[] = []; 
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

      await this.smartContractService.updateProduct(
        id,
        name,
        description,
        price,
        quantity,
        brand,
        category,
        size,
        status,
        imagecids,
        filecids,
      );
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error; 
    }
  }


  async getAllProductOnChain() { return await this.smartContractService.getAllProducts(); }
  

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }


  async findAll(): Promise<{ count: number; product_ids: string[] }> {
    const products = await this.productRepository.find(); 
    const count = products.length; 
    const product_ids = products.map(product => product.id); 
    return { count, product_ids };
  }


  async delete(id: string): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return result.affected > 0;
  }

























}
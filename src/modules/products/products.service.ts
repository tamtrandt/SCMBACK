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
    files

  ): Promise<any> {
    //Generate ID
    const generatedId = uuidv4();
 // Array to store CIDs and QR codes for each file
 const filecids = [];
 const imagecids = [];
 const qrCodes = [];
 const images = files.filter(file => file.mimetype.startsWith('image/'));
 const otherfiles = files.filter(file => !file.mimetype.startsWith('image/'));
 const imageBuffers = images.map(file => file.buffer);
const fileBuffers = otherfiles.map(image => image.buffer); // Lấy buffer của từng file


 // Upload each buffer individually to IPFS and generate QR code for each CID
 for (const buffer of fileBuffers) {
  // Tải tệp lên IPFS và nhận CID
  const filecid = await this.storage.upload(buffer); // Giả sử upload hỗ trợ buffer
  filecids.push(filecid);
  
  // Lấy URL từ CID
  const { url } = await this.storage.download(filecid);

  // Tạo mã QR cho URL và lưu dưới dạng Data URL
  const qrCode = await QRCode.toDataURL(url);
  qrCodes.push(qrCode);
}
// Upload each buffer individually to IPFS and generate QR code for each CID
for (const buffer of imageBuffers) {
  // Tải tệp lên IPFS và nhận CID
  const imagecid = await this.storage.upload(buffer); // Giả sử upload hỗ trợ buffer
  imagecids.push(imagecid);
  
  // Lấy URL từ CID
  const { url } = await this.storage.download(imagecid);


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
    imagecids,
    filecids, // CIDs of the files on IPFS
  );

  // Lưu thông tin cơ bản về sản phẩm vào PostgreSQL, không lưu files
  const newProduct = this.productRepository.create({
      id: generatedId,
      transactionHash: transactionHash,
      create_at: new Date(),
      update_at: new Date(),
      qrcode: qrCodes,
      
  });

    return await this.productRepository.save(newProduct);
  }


   // Gọi hàm getProduct từ SmartContractService
   async getProductOnChain(id: string): Promise<DataProductOnchain> {
    return this.smartContractService.getProduct(id);
   }

    // Tạo một hàm riêng để xử lý việc upload và lấy CID
    private uploadFiles = async (files: Express.Multer.File[]): Promise<string[]> => {
      const cids: string[] = [];
      for (const file of files) {
        const cid = await this.storage.upload(file.buffer); // Upload buffer của file lên IPFS
        cids.push(cid);
        
        // Lấy URL từ CID
        const { url } = await this.storage.download(cid);
        //console.log('Uploaded URL:', url);
        
        // Tạo mã QR (nếu cần)
        // const qrCode = await QRCode.toDataURL(url);
        // qrCodes.push(qrCode);
      }
      return cids;
    };
//Update On Chain
async updateProduct(
  id: string, // ID sản phẩm
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
    const qrCodes: string[] = []; // Chỉ định kiểu cho qrCodes
    const images = newFiles.filter(file => file.mimetype.startsWith('image/'));
    const otherFiles = newFiles.filter(file => !file.mimetype.startsWith('image/'));

      // Upload hình ảnh và các tệp khác
      const uploadedImageCids = await this.uploadFiles(images);
      const uploadedFileCids = await this.uploadFiles(otherFiles);
      // Đảm bảo imagecids là một mảng hoặc chuyển đổi thành mảng nếu nó không phải là mảng
if (imagecids === undefined) {
  imagecids = [];
} else if (!Array.isArray(imagecids)) {
  imagecids = [imagecids]; // Tạo mảng mới và giữ lại phần tử đó
}

// Đảm bảo filecids là một mảng hoặc chuyển đổi thành mảng nếu nó không phải là mảng
if (filecids === undefined) {
  filecids = [];
} else if (!Array.isArray(filecids)) {
  filecids = [filecids]; // Tạo mảng mới và giữ lại phần tử đó
}
  
      // Gộp các CIDs mới vào danh sách hiện tại
      imagecids.push(...uploadedImageCids);
      filecids.push(...uploadedFileCids);


  

    // Gọi dịch vụ hợp đồng thông minh để cập nhật sản phẩm
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
    throw error; // Ném lỗi để xử lý ở mức cao hơn hoặc theo cách khác
  }
}


async getAllProductOnChain() {  
  try {
      // Gọi hàm từ smart contract service
       
      return await this.smartContractService.getAllProducts();
          
         
  } catch (error) {
      return {
          success: false,
          message: error.message, // Trả về thông điệp lỗi
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


  async delete(id: string): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return result.affected > 0; 
  }

























}
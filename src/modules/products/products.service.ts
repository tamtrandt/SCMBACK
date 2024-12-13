import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { SmartContractService } from '../blockchain/ProductContract/smartcontract.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ethers } from 'ethers';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class ProductService {
  private storage = new ThirdwebStorage();
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
    private readonly smartContractService: SmartContractService,
    private readonly httpService: HttpService,
    private readonly mailerService: MailerService,
  ) {
    const apiKey = this.configService.get<string>('THIRDWEB_API_KEY');
    this.storage = new ThirdwebStorage({ secretKey: apiKey });
  }

  // Helper function to convert price to string format
  private priceToString(price: number): string {
    return price.toFixed(2); 
  }

  private generateUniqueId(): number {
    const timestamp = Date.now() % 100000; // Get the last 5 digits of the timestamp
    const randomSuffix = Math.floor(Math.random() * 1000); // Add 3 random digits
    return parseInt(`${timestamp}${randomSuffix}`);
  }

  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[], // Uploaded files
    walletAddress: string, // Creator's wallet address
  ): Promise<any> {
    const tokenId = this.generateUniqueId(); // Generate unique token ID for the product

    // Categorize files (images and other files)
    const images = files.filter((file) => file.mimetype.startsWith('image/'));
    const otherFiles = files.filter((file) => !file.mimetype.startsWith('image/'));
    const imageCIDs = await this.GetCids(images); // Get CIDs for images
    const fileCIDs = await this.GetCids(otherFiles); // Get CIDs for other files

    // Create product metadata
    const productMetadata = {
      id: tokenId,
      name: createProductDto.name,
      description: createProductDto.description,
      brand: createProductDto.brand,
      category: createProductDto.category,
      size: createProductDto.size,
      imagecids: imageCIDs, // CIDs for images
      filecids: fileCIDs,   // CIDs for other files
      creater: walletAddress, // Creator's wallet address
    };

    // Upload metadata to IPFS
    const metadataCID = await this.storage.upload(productMetadata);
    const metadataResponse = await this.storage.download(metadataCID);
    const metadataURL = metadataResponse.url;

    // Set the wallet address for the backend
    this.smartContractService.setWalletAddress(walletAddress);

    // Convert price to string format and get other parameters
    const priceString = this.priceToString(createProductDto.price); // Convert price to string
    const amount = createProductDto.quantity; // Total quantity to mint
    const quantity = createProductDto.quantity; // Quantity in stock
    const status = 'available'; // Default status

    try {
      // Call the mintProduct function from the smart contract
      const data = await this.smartContractService.mintProduct(
        tokenId,
        amount,
        metadataURL,
        priceString,
        quantity,
        status,
      );

      const transactionHash = await this.storage.upload(data);
      const transacrespone = await this.storage.download(transactionHash);
      const transURL = transacrespone.url;
     

      // Call store event with the transaction URL
      await this.smartContractService.callStoreEventCID(tokenId, transURL);

      // Save to the database
      return tokenId;
    } catch (error) {
      console.error('Error minting product or saving to database:', error);
      throw new Error('Failed to create product');
    }
  }
// Get product details from SmartContractService
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
      ...productInfo, // Includes price, quantity, status, owner
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw new Error('Unable to fetch product details from blockchain.');
  }
}

// Get all products on-chain
async getAllProductOnChain() {
  return await this.smartContractService.getAllTokenIds();
}

// Helper function to handle file upload and get CIDs
private GetCids = async (files: Express.Multer.File[]): Promise<string[]> => {
  const cids: string[] = [];
  for (const file of files) {
    const cid = await this.storage.upload(file.buffer);
    cids.push(cid);
  }
  return cids;
};

// Function to convert CIDs to URLs and generate QR codes
private generateQRCodesFromCIDs = async (cids: string[]): Promise<string[]> => {
  const qrCodes: string[] = [];
  for (const cid of cids) {
    const { url } = await this.storage.download(cid);
    const qrCode = await QRCode.toDataURL(url);
    qrCodes.push(qrCode);
  }
  return qrCodes;
};

async updateMetadata(
  id: number,
  name: string,
  description: string,
  brand: string,
  category: string,
  size: string,
  status: string,
  imagecids: string[],
  filecids: string[],
  newFiles: Express.Multer.File[],
  walletAddress: string,
): Promise<any> {
  try {
    const qrCodes = [];
    const images = newFiles.filter(file => file.mimetype.startsWith('image/'));
    const otherFiles = newFiles.filter(file => !file.mimetype.startsWith('image/'));

    const uploadedImageCids = await this.GetCids(images);
    const uploadedFileCids = await this.GetCids(otherFiles);

    if (!imagecids) imagecids = [];
    if (!filecids) filecids = [];
    imagecids = Array.isArray(imagecids) ? imagecids : [imagecids];
    filecids = Array.isArray(filecids) ? filecids : [filecids];

    imagecids.push(...uploadedImageCids);
    filecids.push(...uploadedFileCids);

    const fileQRCodes = await this.generateQRCodesFromCIDs(filecids);
    qrCodes.push(...fileQRCodes);
    const imageQRCodes = await this.generateQRCodesFromCIDs(imagecids);
    qrCodes.push(...imageQRCodes);

    this.smartContractService.setWalletAddress(walletAddress);

    const metadata = {
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

    const metadataCID = await this.storage.upload(metadata);
    const metadataResponse = await this.storage.download(metadataCID);
    const metadataURL = metadataResponse.url;
    console.log('Uploaded metadata CID:', metadataURL);

    const transactionUpdate = await this.smartContractService.updateMetadata(id, metadataCID);
    const transactionHash = await this.storage.upload(transactionUpdate);
    const transacResponse = await this.storage.download(transactionHash);
    const transURL = transacResponse.url;
    await this.smartContractService.callStoreEventCID(id, transURL);

    return transactionUpdate;
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error;
  }
}
 // Update product price
async updateProductPrice(id: number, price: string, walletAddress: string): Promise<any> {
  try {
    this.smartContractService.setWalletAddress(walletAddress);

    const transactionUpdatePrice = await this.smartContractService.updatePrice(id, price);
    const transactionHash = await this.storage.upload(transactionUpdatePrice);
    const transacResponse = await this.storage.download(transactionHash);
    const transURL = transacResponse.url;
    await this.smartContractService.callStoreEventCID(id, transURL);

    return transactionUpdatePrice;
  } catch (error) {
    console.error('Error in ProductService updating price:', error);
    throw new Error('Failed to update product price');
  }
}

// Update product quantity
async updateProductQuantity(id: number, quantity: number, walletAddress: string): Promise<any> {
  try {
    this.smartContractService.setWalletAddress(walletAddress);

    const transactionUQuan = await this.smartContractService.updateQuantity(id, quantity);
    const transactionHash = await this.storage.upload(transactionUQuan);
    const transacResponse = await this.storage.download(transactionHash);
    const transURL = transacResponse.url;
    await this.smartContractService.callStoreEventCID(id, transURL);

    return transactionUQuan;
  } catch (error) {
    console.error('Error in ProductService updating quantity:', error);
    throw new Error('Failed to update product quantity');
  }
}

// Find products by TokenId
async findByTokenId(tokenId: number): Promise<Product[]> {
  const products = await this.productRepository.find({
    where: { TokenId: tokenId },  // Filter by TokenId
  });

  if (products.length === 0) {
    throw new NotFoundException(`No products found with TokenId ${tokenId}`);
  }

  return products;
}

// Get all products
async findAll(): Promise<{ count: number; product_ids: number[] }> {
  const products = await this.productRepository.find();
  const count = products.length;
  const product_ids = products.map(product => product.id);
  return { count, product_ids };
}

// Delete product
async delete(id: number, walletAddress: string): Promise<any> {
  this.smartContractService.setWalletAddress(walletAddress);

  const balance = await this.smartContractService.getTokenBalance(walletAddress, id);
  
  if (balance <= 0) {
    throw new Error(`Wallet ${walletAddress} does not own any tokens of ID ${id}`);
  }

  const transactionDelete = await this.smartContractService.burnProduct(id, balance);
  const transactionHash = await this.storage.upload(transactionDelete);
  const transacResponse = await this.storage.download(transactionHash);
  const transURL = transacResponse.url;
  await this.smartContractService.callStoreEventCID(id, transURL);

  return transactionDelete;
}

// Get all CIDs related to a product
async getAllCIDs(tokenId: number) {
  try {
    const cids = await this.smartContractService.getAllCIDs(tokenId);
    const result = await this.getEventData(cids);
    return result;
  } catch (error) {
    console.error('Error fetching CIDs:', error);
    throw new Error('Unable to fetch CIDs from contract');
  }
}

// Get event data from IPFS links
async getEventData(ipfsLinks: string[]) {
  const result = [];

  for (let link of ipfsLinks) {
    try {
      const response = await lastValueFrom(this.httpService.get(link));
      const data = response.data;
      

      const eventObject = {
        transactionHash: data.transactionHash,
        event: {
          tokenId: data.event.tokenId,
          action: data.event.action,
          creator: data.event.creator,
          timestamp: data.event.timestamp,     
        },
        qrCode: await QRCode.toDataURL(link),
      };
      

      result.push(eventObject);
    } catch (error) {
      console.error(`Error fetching data from IPFS: ${link}`, error);
    }
  }

  return result;
}

async buyTokens(
  tokenIds: number[],
  amounts: number[],
  totalPrice: string,
  email: string,
  walletAddress: string
): Promise<{ transactionHash: string; event: any }> {
  try {
    // Convert total price to Wei
    const totalPriceInWei = ethers.utils.parseEther(totalPrice);

    // Set wallet address in smart contract service
    this.smartContractService.setWalletAddress(walletAddress);

    // Call smart contract to buy tokens
    const transactionBuy = await this.smartContractService.buyTokens(
      tokenIds,
      amounts,
      totalPriceInWei
    );

    // Upload transaction to storage
    const transactionHash = await this.storage.upload(transactionBuy);
    const transactionResponse = await this.storage.download(transactionHash);
    const transactionURL = transactionResponse.url;

    // Generate QR code from transaction URL
    const QR = await QRCode.toDataURL(transactionURL);  // Ensure this returns base64-encoded string

    // Format wallet address: 5 digits at the start and end, with "..."
    const formattedWalletAddress =
      walletAddress.slice(0, 5) + '...' + walletAddress.slice(-5);

    // Store event CID in the smart contract
    for (const tokenId of tokenIds) {
      await this.smartContractService.callStoreEventCID(tokenId, transactionURL);
    }

    // Prepare and send the email after successful purchase
    await this.mailerService.sendMail({
      to: email,
      from: 'adhartbayer@gmail.com',
      subject: 'Thank You for Your Purchase!',
      template: 'successfully',  // Ensure this is the template path
      context: {
        username: email, 
        walletAddress: formattedWalletAddress, 
      },
      attachments: [
        {
          filename: 'QRCode.png',  
          path: QR,  
          cid: 'unique-qrcode-id',  
        },
      ],
    });

    return { transactionHash: transactionHash, event: transactionBuy }; // Return transaction details
  } catch (error) {
    console.error('Error in buyTokens:', error);
    throw new BadRequestException('Error processing the purchase'); // Do not send email if an error occurs
  }
}

}
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as ProductContract    from '../abis/ProductRegistry.json';
import { DataProductOnchain } from '../interfaces/productsc';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SmartContractService {
  private contract: ethers.Contract | null = null;
  private walletAddress: string | null = null; // Lưu địa chỉ ví từ frontend

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService, // Injected JwtService
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Khởi tạo contract (chỉ đọc)
    this.contract = new ethers.Contract(contractAddress, ProductContract.abi, provider);
  }

  generateToken(walletAddress: string): string {
    return this.jwtService.sign({ walletAddress });
  }

  /**
   * Lưu địa chỉ ví từ frontend
   */
  setWalletAddress(address: string): void {
    if (!ethers.utils.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }
    this.walletAddress = address;
    console.log('Wallet address set:', address);
  }

  /**
   * Lấy địa chỉ ví hiện tại
   */
  getWalletAddress(): string {
    if (!this.walletAddress) {
      throw new Error('Wallet address is not set. Please connect a wallet.');
    }
    return this.walletAddress;
  }

  /**
   * Tạo signer từ địa chỉ ví được lưu
   */
  private getSigner(): ethers.providers.JsonRpcSigner {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const address = this.getWalletAddress();
    return provider.getSigner(address); // Tạo signer từ địa chỉ ví
  }

  /**
   * Kết nối contract với signer
   */
  private getContractWithSigner(): ethers.Contract {
    if (!this.contract) {
      throw new Error('Contract is not initialized.');
    }

    const signer = this.getSigner();
    return this.contract.connect(signer); // Kết nối signer với contract
  }

  /**
   * Gọi hàm addProduct trên smart contract
   */
  async addProduct(
    id: string,
    name: string,
    description: string,
    price: string,
    quantity: number,
    brand: string,
    category: string,
    size: string,
    status: string,
    imagecids: string[],
    filecids: string[],
  ): Promise<string> {
    const contract = this.getContractWithSigner(); // Lấy contract có signer

    const tx = await contract.addProduct(
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

    const receipt = await tx.wait(); // Chờ giao dịch được xác nhận
    return receipt.transactionHash; // Trả về hash giao dịch
  }


  /**
   * Gọi hàm updateProduct trên smart contract
   */
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
  ): Promise<string> {
    const contract = this.getContractWithSigner();

    const priceString = price.toFixed(2);

    const tx = await contract.updateProduct(
      id,
      name,
      description,
      priceString,
      quantity,
      brand,
      category,
      size,
      status,
      imagecids,
      filecids,
    );

    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  /**
   * Lấy thông tin sản phẩm từ smart contract
   */
  async getProduct(id: string): Promise<DataProductOnchain> {
    const productData = await this.contract.getProduct(id);

    return {
      id,
      name: productData[0],
      description: productData[1],
      price: parseFloat(productData[2]),
      quantity: productData[3].toNumber(),
      brand: productData[4],
      category: productData[5],
      size: productData[6],
      status: productData[7],
      imagecids: productData[8],
      filecids: productData[9],
      creater: productData[10],
    };
  }

  /**
   * Lấy tất cả sản phẩm từ smart contract
   */
  async getAllProducts(): Promise<any> {
    try {
      const [count, ids] = await this.contract.getAllProducts();

      return {
        count: count.toNumber(),
        product_ids: ids,
      };
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as ProductContract from '../abis/ProductManager.json';  // ABI của hợp đồng
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SmartContractService {
  private contract: ethers.Contract | null = null;
  private walletAddress: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Khởi tạo contract (chỉ đọc)
    this.contract = new ethers.Contract(contractAddress, ProductContract.abi, provider);
  }

  // Tạo token JWT từ walletAddress
  generateToken(walletAddress: string): string {
    return this.jwtService.sign({ walletAddress });
  }

  // Lấy địa chỉ ví hiện tại
  getWalletAddress(): string {
    if (!this.walletAddress) {
      throw new Error('Wallet address is not set. Please connect a wallet.');
    }
    return this.walletAddress;
  }

  // Đặt ví cho backend
  setWalletAddress(address: string): void {
    if (!ethers.utils.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }
    this.walletAddress = address; 
  }

  // Lấy signer từ ví
  private getSigner(): ethers.providers.JsonRpcSigner {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const address = this.getWalletAddress();
    return provider.getSigner(address); // Tạo signer từ địa chỉ ví
  }

  // Lấy hợp đồng với signer
  private getContractWithSigner(): ethers.Contract {
    if (!this.contract) {
      throw new Error('Contract is not initialized.');
    }
    const signer = this.getSigner();
    return this.contract.connect(signer); // Kết nối signer với contract
  }

  // Mint a new product
  async mintProduct(
    tokenId: number,
    amount: number,
    metadataCID: string,
    price: string,
    quantity: number,
    status: string,
  ): Promise<string> {
    try {
      const contractWithSigner = this.getContractWithSigner();
      const transaction = await contractWithSigner.mintProduct(
        tokenId,
        amount,
        metadataCID,
        price,
        quantity,
        status,
      );
      await transaction.wait(); // Wait for transaction confirmation
      return transaction.hash; // Return transaction hash
    } catch (error) {
      console.error('Error minting product:', error);
      throw new Error('Minting product failed');
    }
  }

  // Get metadata CID for a product
  async getMetadataCID(tokenId: number): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract is not initialized.');
    }
    return await this.contract.getMetadataCID(tokenId);
  }

  // Get detailed product info
  async getProductInfo(tokenId: number): Promise<{
    metadata: string;
    price: string;
    quantity: number;
    status: string;
    owner: string;
  }> {
    if (!this.contract) {
      throw new Error('Contract is not initialized.');
    }
    const [metadata, price, quantity, status, owner] = await this.contract.getProductInfo(
      tokenId,
    );
    return { metadata, price, quantity, status, owner };
  }

  // Update the price of a product
  async updatePrice(tokenId: number, newPrice: string): Promise<string> {
    try {
      const contractWithSigner = this.getContractWithSigner();
      const transaction = await contractWithSigner.updatePrice(
        tokenId,
        newPrice,
      );
      await transaction.wait();
      return transaction.hash;
    } catch (error) {
      console.error('Error updating price:', error);
      throw new Error('Updating price failed');
    }
  }

  // Update the quantity of a product
  async updateQuantity(tokenId: number, newQuantity: number): Promise<string> {
    try {
      const contractWithSigner = this.getContractWithSigner();
      const transaction = await contractWithSigner.updateQuantity(
        tokenId,
        newQuantity,
      );
      await transaction.wait();
      return transaction.hash;
    } catch (error) {
      console.error('Error updating quantity:', error);
      throw new Error('Updating quantity failed');
    }
  }
   // Update the quantity of a product
   async updateMetadata(tokenId: number, newMetadataCID: string): Promise<string> {
    try {
      const contractWithSigner = this.getContractWithSigner();
      const transaction = await contractWithSigner.updateMetadata(
        tokenId,
        newMetadataCID,
      );
      await transaction.wait();
      return transaction.hash;
    } catch (error) {
      console.error('Error updating metadata:', error);
      throw new Error('Updating metadata failed');
    }
  }

  // Update the status of a product
  async updateStatus(tokenId: number, newStatus: string): Promise<string> {
    try {
      const contractWithSigner = this.getContractWithSigner();
      const transaction = await contractWithSigner.updateStatus(
        tokenId,
        newStatus,
      );
      await transaction.wait();
      return transaction.hash;
    } catch (error) {
      console.error('Error updating status:', error);
      throw new Error('Updating status failed');
    }
  }

  // Get all token IDs owned by the connected wallet
  async getAllTokenIds(): Promise<number[]> {
    if (!this.contract) {
      throw new Error('Contract is not initialized.');
    }
    const connectedWallet = this.getWalletAddress();
    const allTokenIds = await this.contract.getAllTokenIds();
    return allTokenIds.filter(async (tokenId) => {
      const owner = await this.contract.currentOwner(tokenId);
      return owner === connectedWallet;
    });
  
}
}
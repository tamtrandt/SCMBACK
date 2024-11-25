import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BigNumber, ethers } from 'ethers';
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

  //Decode Event
  private decodeEvent(event: any) {
    return {
      tokenId: BigNumber.from(event[0]).toNumber(), // Chuyển tokenId từ BigNumber sang số
      action: event[1], // Chuỗi hành động (ví dụ: 'MINT')
      initiator: event[2], // Địa chỉ của người khởi tạo
      timestamp: new Date(BigNumber.from(event[3]).toNumber() * 1000).toISOString(),
 // Chuyển đổi timestamp (giả sử Unix epoch)
      additionalInfo: event[4], // Thông tin thêm (URL metadata hoặc CID IPFS)
    };
  }
    // --------------------
    // Create (C)
    // --------------------
  
    async mintProduct(
      tokenId: number,
      amount: number,
      metadataCID: string,
      price: string,
      quantity: number,
      status: string
    ): Promise<{ transactionHash: string; event: any }> {
      try {
        const contractWithSigner = this.getContractWithSigner();
        const transaction = await contractWithSigner.mintProduct(
          tokenId,
          amount,
          metadataCID,
          price,
          quantity,
          status
        );
    
        // Chờ giao dịch được xác nhận
        const receipt = await transaction.wait();
    
        // Phân tích log để lấy event
        const eventLog = receipt.logs
          .map((log) => {
            try {
              return this.contract.interface.parseLog(log); // Giải mã log
            } catch (error) {
              return null; // Nếu không decode được log, bỏ qua
            }
          })
          .find((e) => e && e.name === "TokenStateChanged"); // Tìm sự kiện "TokenStateChanged"
           // Decode event nếu tồn tại
    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    
        // Trả về transaction hash và thông tin event
        return {
          transactionHash: transaction.hash,
          event: decodedEvent, // Trả về dữ liệu của event nếu có
        };
      } catch (error) {
        console.error("Error minting product:", error);
        throw new Error("Minting product failed");
      }
    }
    // Hàm gọi storeEventCID từ smart contract
async  callStoreEventCID(tokenId, cid) {
  try {
    const contractWithSigner = this.getContractWithSigner();
    // Gửi giao dịch để gọi hàm storeEventCID
    const tx = await contractWithSigner.storeEventCID(tokenId, cid);
    
    // Đợi giao dịch được xác nhận
    await tx.wait();
    
  } catch (error) {
    console.error("Error calling storeEventCID:", error);
  }
}
    
  
    // --------------------
    // Update (U)
    // --------------------
  
    // Update the price of a product
    async updatePrice(tokenId: number, newPrice: string): Promise<{ transactionHash: string; event: any }> {
      try {
        const contractWithSigner = this.getContractWithSigner();
        const transaction = await contractWithSigner.updatePrice(
          tokenId,
          newPrice
        );
        // Chờ giao dịch được xác nhận
        const receipt = await transaction.wait();
    
        // Phân tích log để lấy event
        const eventLog = receipt.logs
          .map((log) => {
            try {
              return this.contract.interface.parseLog(log); // Giải mã log
            } catch (error) {
              return null; // Nếu không decode được log, bỏ qua
            }
          })
          .find((e) => e && e.name === "TokenStateChanged"); // Tìm sự kiện "TokenStateChanged"
           // Decode event nếu tồn tại
    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    
        // Trả về transaction hash và thông tin event
        return {
          transactionHash: transaction.hash,
          event: decodedEvent, // Trả về dữ liệu của event nếu có
        };
      } catch (error) {
        console.error("Error updating price:", error);
        throw new Error("Updating price failed");
      }
    }
  
    // Update the quantity of a product
    async updateQuantity(tokenId: number, newQuantity: number): Promise<{ transactionHash: string; event: any }> {
      try {
        const contractWithSigner = this.getContractWithSigner();
        const transaction = await contractWithSigner.updateQuantity(
          tokenId,
          newQuantity
        );
        // Chờ giao dịch được xác nhận
        const receipt = await transaction.wait();
    
        // Phân tích log để lấy event
        const eventLog = receipt.logs
          .map((log) => {
            try {
              return this.contract.interface.parseLog(log); // Giải mã log
            } catch (error) {
              return null; // Nếu không decode được log, bỏ qua
            }
          })
          .find((e) => e && e.name === "TokenStateChanged"); // Tìm sự kiện "TokenStateChanged"
           // Decode event nếu tồn tại
    const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
    
        // Trả về transaction hash và thông tin event
        return {
          transactionHash: transaction.hash,
          event: decodedEvent, // Trả về dữ liệu của event nếu có
        };
      } catch (error) {
        console.error("Error updating quantity:", error);
        throw new Error("Updating quantity failed");
      }
    }
  
    // Update the metadata of a product
    async updateMetadata(
      tokenId: number,
      newMetadataCID: string
    ): Promise<{ transactionHash: string; event: any }> {
      try {
        const contractWithSigner = this.getContractWithSigner();
        const transaction = await contractWithSigner.updateMetadata(
          tokenId,
          newMetadataCID
        );
         // Chờ giao dịch được xác nhận
         const receipt = await transaction.wait();
    
         // Phân tích log để lấy event
         const eventLog = receipt.logs
           .map((log) => {
             try {
               return this.contract.interface.parseLog(log); // Giải mã log
             } catch (error) {
               return null; // Nếu không decode được log, bỏ qua
             }
           })
           .find((e) => e && e.name === "TokenStateChanged"); // Tìm sự kiện "TokenStateChanged"
            // Decode event nếu tồn tại
     const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
     
         // Trả về transaction hash và thông tin event
         return {
           transactionHash: transaction.hash,
           event: decodedEvent, // Trả về dữ liệu của event nếu có
         };
      } catch (error) {
        console.error("Error updating metadata:", error);
        throw new Error("Updating metadata failed");
      }
    }
  
    // Update the status of a product
    async updateStatus(tokenId: number, newStatus: string): Promise<{ transactionHash: string; event: any }> {
      try {
        const contractWithSigner = this.getContractWithSigner();
        const transaction = await contractWithSigner.updateStatus(
          tokenId,
          newStatus
        );
         // Chờ giao dịch được xác nhận
         const receipt = await transaction.wait();
    
         // Phân tích log để lấy event
         const eventLog = receipt.logs
           .map((log) => {
             try {
               return this.contract.interface.parseLog(log); // Giải mã log
             } catch (error) {
               return null; // Nếu không decode được log, bỏ qua
             }
           })
           .find((e) => e && e.name === "TokenStateChanged"); // Tìm sự kiện "TokenStateChanged"
            // Decode event nếu tồn tại
     const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
     
         // Trả về transaction hash và thông tin event
         return {
           transactionHash: transaction.hash,
           event: decodedEvent, // Trả về dữ liệu của event nếu có
         };
      } catch (error) {
        console.error("Error updating status:", error);
        throw new Error("Updating status failed");
      }
    }
  
    // --------------------
    // Delete (D)
    // --------------------
  
    // Burn a product
    async burnProduct(tokenId: number, amount: number): Promise<{ transactionHash: string; event: any }> {
      try {
        const contractWithSigner = this.getContractWithSigner();
        const transaction = await contractWithSigner.burnProduct(tokenId, amount);
         // Chờ giao dịch được xác nhận
         const receipt = await transaction.wait();
    
         // Phân tích log để lấy event
         const eventLog = receipt.logs
           .map((log) => {
             try {
               return this.contract.interface.parseLog(log); // Giải mã log
             } catch (error) {
               return null; // Nếu không decode được log, bỏ qua
             }
           })
           .find((e) => e && e.name === "TokenStateChanged"); // Tìm sự kiện "TokenStateChanged"
            // Decode event nếu tồn tại
     const decodedEvent = eventLog ? this.decodeEvent(eventLog.args) : null;
     
         // Trả về transaction hash và thông tin event
         return {
           transactionHash: transaction.hash,
           event: decodedEvent, // Trả về dữ liệu của event nếu có
         };
      } catch (error) {
        console.error("Error burning product:", error);
        throw new Error("Burn product failed");
      }
    }
  
    // --------------------
    // Read (R)
    // --------------------
  
    // Get metadata CID for a product
    async getMetadataCID(tokenId: number): Promise<string> {
      if (!this.contract) {
        throw new Error("Contract is not initialized.");
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
        throw new Error("Contract is not initialized.");
      }
      const [metadata, price, quantity, status, owner] =
        await this.contract.getProductInfo(tokenId);
      return { metadata, price, quantity, status, owner };
    }
  
    async getAllTokenIds(): Promise<{ count: number; product_ids: number[] }> {
      try {
        // Gọi hàm smart contract
        const [count, productIds]: [ethers.BigNumber, ethers.BigNumber[]] = 
          await this.contract.getAllTokenIds();
    
        // Chuyển đổi dữ liệu từ BigNumber sang kiểu số
        return {
          count: count.toNumber(),
          product_ids: productIds.map((tokenId) => tokenId.toNumber()),
        };
      } catch (error) {
        console.error("Error fetching token IDs:", error);
        throw new Error("Error fetching token IDs");
      }
    }
    // Get all owners of a specific token
    async getTokenOwners(tokenId: number): Promise<string[]> {
      try {
        return await this.contract.getTokenOwners(tokenId);
      } catch (error) {
        console.error("Error fetching token owners:", error);
        throw new Error("Error fetching token owners");
      }
    }
  
    // Get token balance for a specific wallet and token
    async getTokenBalance(
      walletAddress: string,
      tokenId: number
    ): Promise<number> {
      try {
        const balance = await this.contract.balanceOf(walletAddress, tokenId);
        return balance.toNumber();
      } catch (error) {
        console.error("Error fetching token balance:", error);
        throw new Error("Failed to fetch token balance");
      }
    }
    //Get all Trans in TokenId
    async  getAllCIDs(tokenId) {
      try {
        const cids = await this.contract.getTransactionCIDs(tokenId);
        return cids;
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      }
    }
}
 
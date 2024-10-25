import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as ProductContract    from '../abis/ProductRegistry.json';
import { ProductSC } from '../interfaces/productsc';




@Injectable()
export class SmartContractService {
    private contract: ethers.Contract;

    constructor(private configService: ConfigService,

    ) {
         //Connect Smart Contract
  // Khởi tạo kết nối đến smart contract
  const rpcUrl = this.configService.get<string>('RPC_URL');
  const privateKey = this.configService.get<string>('PRIVATE_KEY');
  const contractAddress = this.configService.get<string>('CONTRACT_ADDRESS');

 // Thiết lập provider và wallet
 const provider = new ethers.providers.JsonRpcProvider(rpcUrl); // Sử dụng JsonRpcProvider
 const wallet = new ethers.Wallet(privateKey, provider);

  // Kết nối với hợp đồng
  this.contract = new ethers.Contract(contractAddress, ProductContract.abi, wallet);
    }





    async addProduct(
        id: string, // Sử dụng string cho ID UUID
        name: string,
        description: string,
        price: number,
        quantity: number,
        status: string,
        cids: string[] // Cập nhật từ ipfsUrl thành mảng CIDs
    ): Promise<string> {
       // Chuyển mảng CIDs thành chuỗi JSON để lưu trên blockchain
  //const cidString = JSON.stringify(cids);
        const tx = await this.contract.addProduct(id, name, description, price, quantity, status, cids);
        const receipt = await tx.wait(); // Chờ giao dịch được xác nhận
    
        // Trả về transaction hash
        console.log(`Product added with transaction hash: ${receipt.transactionHash}`);
        return receipt.transactionHash; // Trả về transaction hash
    }

    // Cập nhật thông tin sản phẩm
    async updateProduct(id: number, name: string, description: string, price: number, quantity: number, status: string, cids: string[]): Promise<void> {
      //const cidString = JSON.stringify(cids);
      const tx = await this.contract.updateProduct(id, name, description, price, quantity, status, cids);
        const receipt = await tx.wait();

        console.log(`Product updated with transaction hash: ${receipt.transactionHash}`);
    }

    // Lấy thông tin sản phẩm
    async getProduct(id: string): Promise<ProductSC> {
        const productData = await this.contract.getProduct(id);
        // Chuyển đổi cidString JSON trở lại mảng CIDs
  //const cids = JSON.parse(productData[5]);
        
        return {
            id,
            name: productData[0],
            description: productData[1],
            price: productData[2].toNumber(),
            quantity: productData[3].toNumber(),
            status: productData[4],
            cids: productData[5],
            //blockHash: '' // Bạn có thể cập nhật giá trị này nếu lưu trữ block hash từ giao dịch khi thêm/cập nhật
        };
    }

    // Hàm gọi đến smart contract để lấy tất cả sản phẩm
  async getAllProducts(): Promise<any> {
    try {
      const products = await this.contract.getAllProducts(); // Gọi hàm trên smart contract
      return products;
    } catch (error) {
      throw new Error(`Failed to get products: ${error.message}`);
    }
  }

}

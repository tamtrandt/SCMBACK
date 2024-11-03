import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as ProductContract    from '../abis/ProductRegistry.json';
import { DataProductOnchain } from '../interfaces/productsc';

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
 const provider = new ethers.providers.JsonRpcProvider(rpcUrl); 
 const wallet = new ethers.Wallet(privateKey, provider);

  // Kết nối với hợp đồng
  this.contract = new ethers.Contract(contractAddress, ProductContract.abi, wallet);
}





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
      filecids: string[]  
  ): Promise<string> {
      // Gọi phương thức addProduct trên smart contract
      const tx = await this.contract.addProduct(
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
          filecids 
      );

      const receipt = await tx.wait(); 
      return receipt.transactionHash; 
}


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
      filecids: string[]
): Promise<void> {

    const priceString = price.toFixed(2); 

    const tx = await this.contract.updateProduct(id, name, description, priceString, quantity,brand,category,
    size, status,  imagecids,filecids);

    const receipt = await tx.wait();
    return receipt.transactionHash;
}

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

// Hàm gọi đến smart contract để lấy tất cả sản phẩm
async getAllProducts(): Promise<any> {
    try {
        // Gọi hàm trên smart contract
        const [count, ids] = await this.contract.getAllProducts();

        const result = {
            count: count.toNumber(),
            product_ids: ids 
        };
        return result;
    } catch (error) {
        throw new Error(`Failed to get products: ${error.message}`);
    }
}

}

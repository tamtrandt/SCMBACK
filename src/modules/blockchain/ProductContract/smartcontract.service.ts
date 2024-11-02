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
 const provider = new ethers.providers.JsonRpcProvider(rpcUrl); // Sử dụng JsonRpcProvider
 const wallet = new ethers.Wallet(privateKey, provider);

  // Kết nối với hợp đồng
  this.contract = new ethers.Contract(contractAddress, ProductContract.abi, wallet);
    }





    async addProduct(
      id: string, // Sử dụng string cho ID UUID
      name: string,
      description: string,
      price: string, // Thay đổi giá trị từ number sang string
      quantity: number,
      brand: string, // Thêm brand vào tham số
      category: string, // Thêm category vào tham số
      size: string, // Thêm size vào tham số
      status: string,
      imagecids: string[],
      filecids: string[]  // Cập nhật từ ipfsUrl thành mảng CIDs
  ): Promise<string> {
      // Chuyển mảng CIDs thành chuỗi JSON để lưu trên blockchain (nếu cần)
      // const cidString = JSON.stringify(cids); // Nếu smart contract của bạn yêu cầu chuỗi

      // Gọi phương thức addProduct trên smart contract
      const tx = await this.contract.addProduct(
          id,
          name,
          description,
          price, // Truyền giá trị dạng string
          quantity,
          brand, // Thêm brand vào tham số truyền
          category, // Thêm category vào tham số truyền
          size, // Thêm size vào tham số truyền
          status,
          imagecids,
          filecids // Truyền mảng CIDs vào tham số
      );

      const receipt = await tx.wait(); // Chờ giao dịch được xác nhận

      // Trả về transaction hash
      console.log(`Product added with transaction hash: ${receipt.transactionHash}`);
      return receipt.transactionHash; // Trả về transaction hash
  }


  async updateProduct(
    id: string, // Sử dụng string cho ID UUID
      name: string,
      description: string,
      price: number, // Thay đổi giá trị từ number sang string
      quantity: number,
      brand: string, // Thêm brand vào tham số
      category: string, // Thêm category vào tham số
      size: string, // Thêm size vào tham số
      status: string,
      imagecids: string[],
      filecids: string[]
): Promise<void> {
    // Chuyển đổi price thành chuỗi
    const priceString = price.toFixed(2); // Giữ lại 2 chữ số thập phân, có thể tùy chỉnh

    const tx = await this.contract.updateProduct(id, name, description, priceString, quantity,brand,category,size, status, filecids, imagecids);
    const receipt = await tx.wait();

    console.log(`Product updated with transaction hash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
}

    async getProduct(id: string): Promise<DataProductOnchain> {
      const productData = await this.contract.getProduct(id);
      
      // Nếu cids là chuỗi JSON, bạn có thể cần parse nó (nếu cần)
      // const cids = JSON.parse(productData[5]); 
  
      return {
          id,
          name: productData[0],
          description: productData[1],
          price: parseFloat(productData[2]), // Chuyển đổi giá thành số
          quantity: productData[3].toNumber(),
          brand: productData[4], // Giả định rằng brand ở vị trí thứ 6
          category: productData[5], // Giả định rằng category ở vị trí thứ 7
          size: productData[6], // Giả định rằng size ở vị trí thứ 8
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

        // Chuyển đổi kết quả về định dạng bạn mong muốn
        const result = {
            count: count.toNumber(), // Chuyển đổi count sang kiểu số
            product_ids: ids // ids là mảng ID sản phẩm
        };

        return result;
    } catch (error) {
        throw new Error(`Failed to get products: ${error.message}`);
    }
}

}

import { Controller, Post, Body } from '@nestjs/common';
import * as ethers from 'ethers';

import { Public } from 'src/utils/decorator';
import { SmartContractService } from './smartcontract.service';


@Controller('smartcontract')
export class SmartContractController {
  constructor(private readonly smartcontractService: SmartContractService) {}

  @Public()
  @Post('connectWallet')
  connectWallet(@Body() body: { walletAddress: string }) {
    const { walletAddress } = body;

    console.log('Received walletAddress:', walletAddress);

    // Kiểm tra địa chỉ ví có hợp lệ hay không
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    // Tạo JWT token
    const WalletToken = this.smartcontractService.generateToken(walletAddress);

    return { success: true, WalletToken };
  }
}

import { Controller, Post, Body, Param, Get, NotFoundException, UseGuards } from '@nestjs/common';
import * as ethers from 'ethers';

import { Public } from 'src/utils/decorator';
import { SmartContractService } from './smartcontract.service';
import { WalletAuthGuard } from './wallet/wallet.guard';


@Controller('smartcontract')
export class SmartContractController {
  constructor(private readonly smartcontractService: SmartContractService) {}

  @Public()
  @Post('connectWallet')
  connectWallet(@Body() body: { walletAddress: string }) {
    const { walletAddress } = body;
    // Kiểm tra địa chỉ ví có hợp lệ hay không
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    // Tạo JWT token
    const WalletToken = this.smartcontractService.generateToken(walletAddress);
    return { success: true, WalletToken };
  }


}

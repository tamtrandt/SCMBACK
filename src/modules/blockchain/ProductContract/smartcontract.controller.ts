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
    if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }
    const WalletToken = this.smartcontractService.generateToken(walletAddress);
    return { success: true, WalletToken };
  }
}

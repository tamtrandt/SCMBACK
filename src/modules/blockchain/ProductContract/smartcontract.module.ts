import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SmartContractService } from './smartcontract.service';
import { SmartContractController } from './smartcontract.controller';
import { WalletStrategy } from './wallet/wallet.strategy';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwtwallet' }), 
    AuthModule, 
  ],
  providers: [SmartContractService, WalletStrategy],
  controllers: [SmartContractController],
  exports: [SmartContractService],
})
export class SmartContractModule {}

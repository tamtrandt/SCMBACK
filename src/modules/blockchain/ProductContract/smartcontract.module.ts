import { Module } from '@nestjs/common';
import { SmartContractService } from './smartcontract.service';



@Module({
    providers: [SmartContractService],
    exports: [SmartContractService],
})
export class SmartContractModule {}

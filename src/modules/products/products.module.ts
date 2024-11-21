import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductController } from './products.controller';
import { ProductService } from './products.service';
import { SmartContractService } from '../blockchain/ProductContract/smartcontract.service';
import { SmartContractModule } from '../blockchain/ProductContract/smartcontract.module';
import { AuthModule } from '../auth/auth.module';



@Module({
  imports: [TypeOrmModule.forFeature([Product]),AuthModule ],
  controllers: [ProductController],
  providers: [ProductService,SmartContractService ],
})
export class ProductsModule {}


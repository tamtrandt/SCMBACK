import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductController } from './products.controller';
import { ProductService } from './products.service';
import { SmartContractService } from '../blockchain/ProductContract/smartcontract.service';



@Module({
  imports: [TypeOrmModule.forFeature([Product]), ],
  controllers: [ProductController],
  providers: [ProductService,SmartContractService ],
})
export class ProductsModule {}


import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './modules/users/users.module';
import { User } from './modules/users/entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { JwtAuthGuard } from './modules/auth/passport/jwt.guard';
import { ProductsModule } from './modules/products/products.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Product } from './modules/products/entities/product.entity';
import { SmartContractModule } from './modules/blockchain/ProductContract/smartcontract.module';








@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST, 
      port: parseInt(process.env.DB_PORT, 10), 
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User, Product],
      synchronize: true, 
    }),
    //Mail
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Đảm bảo ConfigModule được import để sử dụng env variables
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: "smtp.gmail.com",
          port: 465,
          ignoreTLS: true,
          secure: true,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASS'),
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@localhost>',
        },
        template: {
          dir: process.cwd() +  '/src/utils/templates/',// Đường dẫn tới thư mục chứa template email
          adapter: new HandlebarsAdapter(), // Sử dụng Handlebars làm template engine
          options: {
            strict: true,
          },
        },
       }),
    }),
    //Files Module
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
    //Module
    UsersModule,
    AuthModule,
    ProductsModule,
    SmartContractModule,
   
   
  ],
  controllers: [],
  providers: [
    AppService,  
    {
           provide: APP_GUARD,
           useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

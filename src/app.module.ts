import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
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
      entities: [User],
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
    //Module
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,  
    {
           provide: APP_GUARD,
           useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

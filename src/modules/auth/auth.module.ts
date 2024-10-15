import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './passport/local.strategy';
import { APP_GUARD } from '@nestjs/core';
import { LocalAuthGuard } from './passport/local.guard';
import { JwtStrategy } from './passport/jwt.strategy';
import { JwtAuthGuard } from './passport/jwt.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
      UsersModule,
      PassportModule,
      ConfigModule.forRoot({ isGlobal: true }), // Import ConfigModule và cho phép dùng toàn cục
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'), // Lấy secret từ file .env
          signOptions: { expiresIn: '60s' },
        }),
      }),
      TypeOrmModule.forFeature([User]), 
    ],
    providers: [
        AuthService,
        LocalStrategy,
        JwtStrategy,
        
        
    ],
    controllers: [AuthController],
    exports: [AuthService],
  })
export class AuthModule {}
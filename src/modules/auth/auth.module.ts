import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
      UsersModule,
      PassportModule,
      ConfigModule.forRoot({ isGlobal: true }), 
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('JWT_SECRET'), 
          signOptions: { expiresIn: '1d' },
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
    exports: [AuthService, AuthModule, JwtModule],
  })
export class AuthModule {}
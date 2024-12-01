import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, 'jwtwallet') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header
      ignoreExpiration: false, // Do not ignore token expiration
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { walletAddress: string }) {
    return { walletAddress: payload.walletAddress };
  }
}

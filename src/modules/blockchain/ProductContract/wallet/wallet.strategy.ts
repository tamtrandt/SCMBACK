import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, 'jwtwallet') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Lấy JWT từ header
      ignoreExpiration: false, // Không bỏ qua hạn token
      secretOrKey: configService.get<string>('JWT_SECRET'), 
    });
  }

  /**
   * Hàm validate được gọi khi token hợp lệ
   * @param payload - Payload chứa walletAddress
   * @returns WalletAddress từ token
   */
  async validate(payload: { walletAddress: string }) {
    return { walletAddress: payload.walletAddress };
  }
}

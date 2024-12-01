import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { CanActivate } from '@nestjs/common';

@Injectable()
export class WalletAuthGuard extends AuthGuard('jwtwallet') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }
    return super.canActivate(context) as boolean;
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      console.log('Error:', info?.message);
      throw err || new UnauthorizedException('Invalid or expired WalletToken');
    }
    return user;
  }
}

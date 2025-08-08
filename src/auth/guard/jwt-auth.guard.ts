import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_Payload } from '../types';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = JWT_Payload>(err: unknown, payload: TUser) {
    if (err || !payload) {
      throw err || new UnauthorizedException('Token is not valid');
    }

    return payload;
  }
}

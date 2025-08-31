import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JWT_Payload } from 'src/types';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorator/public.decorator';
import { RedisService } from 'src/redis/redis.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector, private readonly redisService: RedisService) {
    super();
  }
  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }
    const isBlocked = await this.redisService.get(`bl:${token}`);

    if (isBlocked) {
      throw new ForbiddenException('You are logged out. Please log in again');
    }


    return Boolean(await super.canActivate(context))
  }

  handleRequest<TUser = JWT_Payload>(err: unknown, payload: TUser) {
    if (err || !payload) {
      throw err || new UnauthorizedException('Token is not valid');
    }


    return payload;
  }
}

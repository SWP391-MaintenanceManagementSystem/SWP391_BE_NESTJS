import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWT_Payload } from 'src/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('AC_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret!,
    });
  }

  async validate(payload: JWT_Payload): Promise<JWT_Payload> {
    return {
      email: payload.email,
      sub: payload.sub,
      role: payload.role,
      status: payload.status,
      iat: payload.iat,
      exp: payload.exp
    };
  }
}

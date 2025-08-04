import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}
  async generateToken(payLoad: any, type: TokenType): Promise<string> {
    const secretKey =
      type === TokenType.ACCESS
        ? this.configService.get<string>('AC_SECRET')
        : this.configService.get<string>('RF_SECRET');
    const expiresIn =
      type === TokenType.ACCESS
        ? this.configService.get<string>('AC_EXPIRE_TIME')
        : this.configService.get<string>('RF_EXPIRE_TIME');
    return await this.jwtService.signAsync(payLoad, {
      secret: secretKey,
      expiresIn: expiresIn,
    });
  }
}

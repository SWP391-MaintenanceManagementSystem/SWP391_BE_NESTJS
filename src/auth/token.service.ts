import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_Payload, TokenType } from './types';
import { PrismaService } from 'src/prisma/prisma.service';
import { convertMStoDate } from 'src/utils';
import { StringValue } from 'ms';



@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  private getConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing configuration: ${key}`);
    }
    return value;
  }

  async generateToken(payload: JWT_Payload, type: TokenType): Promise<string> {

    const secret = this.getConfig(type === TokenType.ACCESS ? 'AC_SECRET' : 'RF_SECRET');
    const expiresIn = this.getConfig(type === TokenType.ACCESS ? 'AC_EXPIRE_TIME' : 'RF_EXPIRE_TIME');

    return await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });
  }

  async storeToken(accountId: string, refreshToken: string): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.token.deleteMany({
        where: { accountId },
      });
      const expiredTime = (this.configService.get<string>('RF_EXPIRE_TIME') || "7d") as StringValue;
      const expiredDate = convertMStoDate(expiredTime);
      await prisma.token.create({
        data: {
          accountId,
          refreshToken,
          expiredAt: expiredDate,
        },
      });
    });
  }


  async getToken(accountId: string): Promise<string | null> {
    const token = await this.prisma.token.findFirst({
      where: {
        accountId,
      },
    });
    return token ? token.refreshToken : null;
  }

  async deleteToken(accountId: string): Promise<void> {
    await this.prisma.token.deleteMany({
      where: {
        accountId,
      },
    });
  }

  async verifyToken(token: string, type: TokenType): Promise<JWT_Payload> {
    const secretKey = this.getConfig(type === TokenType.ACCESS ? 'AC_SECRET' : 'RF_SECRET');
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: secretKey });
      return payload;
    } catch (error: unknown) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }
}

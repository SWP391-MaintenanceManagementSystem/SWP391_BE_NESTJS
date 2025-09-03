import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Account, AccountStatus } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<Account> {
    const user = await this.authService.validateUser({
      email,
      password,
    });

    if (!user) {
      throw new UnauthorizedException('User not found or password is incorrect');
    }

    if (user.status === AccountStatus.NOT_VERIFY) {
      throw new UnauthorizedException('User is not verified. Please verify your email address.');
    }

    if (user.status === AccountStatus.BANNED) {
      throw new UnauthorizedException('User is banned. Please contact support.');
    }

    if (user.status === AccountStatus.DISABLED) {
      throw new UnauthorizedException('User is disabled. Please contact support.');
    }

    return user;
  }
}

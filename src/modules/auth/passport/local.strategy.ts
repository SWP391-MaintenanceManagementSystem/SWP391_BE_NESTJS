import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Account, AccountStatus } from '@prisma/client';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<AccountWithProfileDTO> {
    const user = await this.authService.validateUser({
      email,
      password,
    });

    if (!user) {
      throw new UnauthorizedException('User not found or password is incorrect');
    }

    if (user.status === AccountStatus.NOT_VERIFY) {
      throw new ForbiddenException({
        message: 'Account not verified. Please verify your account.',
        accountStatus: user.status,
      });
    }

    if (user.status === AccountStatus.BANNED) {
      throw new ForbiddenException({
        message: 'User is banned. Please contact support.',
        accountStatus: user.status,
      });
    }

    if (user.status === AccountStatus.DISABLED) {
      throw new ForbiddenException({
        message: 'User is disabled. Please contact support.',
        accountStatus: user.status,
      });
    }

    return user;
  }
}

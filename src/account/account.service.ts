import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDTO } from './dto/create-account';
import { Account, AuthProvider } from '@prisma/client';
import { OAuthUserDTO } from 'src/auth/dto/oauth-user.dto';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) { }

  async createAccount(
    createAccountDto: CreateAccountDTO,
  ): Promise<Account | null> {
    const account = await this.prisma.account.create({
      data: createAccountDto,
    });
    return account;
  }

  async getAccountByEmail(email: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: { email },
    });
    return account;
  }

  async activateAccount(email: string) {
    await this.prisma.account.update({
      where: { email },
      data: { isVerified: true },
    });
  }

  async findOrCreateOAuthAccount(oauthUser: OAuthUserDTO): Promise<Account> {
    const existingAccount = await this.getAccountByEmail(oauthUser.email);

    if (existingAccount) {
      if (!existingAccount.provider.includes(oauthUser.provider)) {
        const updatedProviders = [...existingAccount.provider, oauthUser.provider];
        const existingProviderId = existingAccount.providerId as Record<string, any> || {};
        const updatedProviderId = {
          ...existingProviderId,
          [oauthUser.provider]: oauthUser.providerId,
        };

        return await this.prisma.account.update({
          where: { email: oauthUser.email },
          data: {
            provider: updatedProviders,
            providerId: updatedProviderId,
            isVerified: true,
          },
        });
      }
      return existingAccount;
    }

    return await this.prisma.account.create({
      data: {
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        provider: [oauthUser.provider],
        providerId: {
          [oauthUser.provider]: oauthUser.providerId,
        },
        isVerified: true,
      },
    });
  }
}

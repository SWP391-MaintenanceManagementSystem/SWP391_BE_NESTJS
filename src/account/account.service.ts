import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { Account, AccountStatus, Prisma } from '@prisma/client';
import { OAuthUserDTO } from 'src/auth/dto/oauth-user.dto';
import { FilterOptionsDTO } from './dto/filter-options.dto';
import { PaginationResponse } from 'src/dto/pagination-response.dto';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async createAccount(createAccountDto: CreateAccountDTO): Promise<Account | null> {
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
      data: { status: AccountStatus.VERIFIED },
    });
  }

  async findOrCreateOAuthAccount(oauthUser: OAuthUserDTO): Promise<Account> {
    const existingAccount = await this.getAccountByEmail(oauthUser.email);

    if (existingAccount) {
      if (!existingAccount.provider.includes(oauthUser.provider)) {
        const updatedProviders = [...existingAccount.provider, oauthUser.provider];
        return await this.prisma.account.update({
          where: { email: oauthUser.email },
          data: {
            password: existingAccount.password,
            provider: updatedProviders,
            status: AccountStatus.VERIFIED,
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
        status: AccountStatus.VERIFIED,
      },
    });
  }

  async getAccounts(options: FilterOptionsDTO<Account>): Promise<PaginationResponse<Account>> {
    const page = options.page && options.page > 0 ? options.page : 1;
    const pageSize = options.pageSize || 10;
    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where: options.where,
        orderBy: options.orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.account.count({ where: options.where }),
    ]);
    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getAccountById(id: string): Promise<Account | null> {
    const account = await this.prisma.account.findUnique({
      where: { accountId: id },
    });
    return account;
  }

  async updateAccount(id: string, updateData: Prisma.AccountUpdateInput): Promise<void> {
    const exists = await this.prisma.account.findUnique({ where: { accountId: id } });
    if (!exists) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }
    await this.prisma.account.update({
      where: { accountId: id },
      data: updateData,
    });
  }

  async deleteAccount(id: string): Promise<void> {
    const exists = await this.prisma.account.findUnique({ where: { accountId: id } });
    if (!exists) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }
    await this.prisma.account.update({
      where: { accountId: id },
      data: { status: AccountStatus.DISABLED },
    });
  }
}

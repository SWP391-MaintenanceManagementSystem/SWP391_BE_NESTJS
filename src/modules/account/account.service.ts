import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { Account, AccountRole, AccountStatus, Prisma } from '@prisma/client';
import { OAuthUserDTO } from 'src/modules/auth/dto/oauth-user.dto';
import { FilterOptionsDTO } from './dto/filter-options.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountWithProfileDTO, Profile } from './dto/account-with-profile.dto';
import { CustomerDTO } from '../customer/dto/customer.dto';
import { EmployeeDTO } from '../employee/dto/employee.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) { }

  async createAccount(createAccountDto: CreateAccountDTO): Promise<Account | null> {
    const account = await this.prisma.account.create({
      data: createAccountDto,
    });
    return account;
  }

  async getAccountByEmail(email: string): Promise<AccountWithProfileDTO | null> {
    const account = await this.prisma.account.findUnique({
      where: { email: email },
      include: {
        customer: true,
        employee: true
      }
    });

    if (!account) {
      return null;
    }


    let profile: Profile | null = null;

    switch (account.role) {
      case AccountRole.CUSTOMER:
        if (account.customer) {
          profile = plainToInstance(CustomerDTO, account.customer);
        }
        break;
      case AccountRole.STAFF || AccountRole.TECHNICIAN:
        if (account.employee) {
          profile = plainToInstance(EmployeeDTO, account.employee);
        }
        break;
      default:
        profile = null;
    }

    const response: AccountWithProfileDTO = {
      ...account,
      password: account.password || null,
      profile
    }
    return response
  }

  async activateAccount(email: string): Promise<boolean> {
    try {
      const account = await this.prisma.account.update({
        where: { email },
        data: { status: AccountStatus.VERIFIED },
      });
      return !!account
    } catch (error) {
      console.error('Error activating account:', error);
      return false;
    }
  }

  async findOrCreateOAuthAccount(oauthUser: OAuthUserDTO): Promise<AccountWithProfileDTO> {
    const existingAccount = await this.getAccountByEmail(oauthUser.email);

    if (existingAccount) {
      if (!existingAccount.provider.includes(oauthUser.provider)) {
        const updatedProviders = [...existingAccount.provider, oauthUser.provider];
        await this.prisma.account.update({
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

    const account = await this.prisma.account.create({
      data: {
        email: oauthUser.email,
        provider: [oauthUser.provider],
        status: AccountStatus.VERIFIED,
      },
    });

    const customer = await this.prisma.customer.create({
      data: {
        firstName: oauthUser.firstName || 'FirstName',
        lastName: oauthUser.lastName || 'LastName',
        accountId: account.id,
      }
    })
    const response: AccountWithProfileDTO = {
      ...account,
      password: account.password || null,
      profile: plainToInstance(CustomerDTO, customer)
    }
    return response;
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

  async getAccountById(id: string): Promise<AccountWithProfileDTO | null> {
    const account = await this.prisma.account.findUnique({
      where: { id: id },
      include: {
        customer: true,
        employee: true
      }
    });

    if (!account) {
      return null;
    }


    let profile: Profile | null = null;

    switch (account.role) {
      case AccountRole.CUSTOMER:
        if (account.customer) {
          profile = plainToInstance(CustomerDTO, account.customer);
        }
        break;
      case AccountRole.STAFF || AccountRole.TECHNICIAN:
        if (account.employee) {
          profile = plainToInstance(EmployeeDTO, account.employee);
        }
        break;
      default:
        profile = null;
    }

    const response: AccountWithProfileDTO = {
      ...account,
      password: account.password || null,
      profile: profile
    }
    return response
  }




  async updateAccount(id: string, updateData: Prisma.AccountUpdateInput): Promise<void> {
    const exists = await this.prisma.account.findUnique({ where: { id: id } });
    if (!exists) {
      throw new NotFoundException(`Account with id ${id} not found`)
    }

    await this.prisma.account.update({
      where: { id: id },
      data: updateData,
    });
  }

  async deleteAccount(id: string): Promise<void> {
    const exists = await this.prisma.account.findUnique({ where: { id: id } });
    if (!exists) {
      throw new NotFoundException(`Account with id ${id} not found`);
    }
    await this.prisma.account.update({
      where: { id: id },
      data: { status: AccountStatus.DISABLED },
    });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { Account, AccountRole, AccountStatus, Prisma, SubscriptionStatus } from '@prisma/client';
import { OAuthUserDTO } from 'src/modules/auth/dto/oauth-user.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountWithProfileDTO, Profile } from './dto/account-with-profile.dto';
import { CustomerDTO } from '../customer/dto/customer.dto';
import { EmployeeDTO } from '../employee/dto/employee.dto';
import { plainToInstance } from 'class-transformer';
import { CloudinaryService } from '../upload/cloudinary.service';
import { buildAccountOrderBy } from 'src/common/sort/sort.util';
import { SubscriptionDTO } from '../subscription/dto/subscription.dto';
@Injectable()
export class AccountService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

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
        employee: true,
      },
    });

    if (!account) {
      return null;
    }
    return this.mapAccountToDTO(account);
  }

  async activateAccount(email: string): Promise<boolean> {
    try {
      const account = await this.prisma.account.update({
        where: { email },
        data: { status: AccountStatus.VERIFIED },
      });
      return !!account;
    } catch (error) {
      console.error('Error activating account:', error);
      return false;
    }
  }

  async findOrCreateOAuthAccount(oauthUser: OAuthUserDTO): Promise<AccountWithProfileDTO> {
    const existingAccount = await this.getAccountByEmail(oauthUser.email);

    if (existingAccount) {
      if (existingAccount.status === AccountStatus.DISABLED) {
        throw new ForbiddenException({
          message: 'User is banned. Please contact support.',
          accountStatus: existingAccount.status,
        });
      }

      if (existingAccount.status === AccountStatus.BANNED) {
        throw new ForbiddenException({
          message: 'User is banned. Please contact support.',
          accountStatus: existingAccount.status,
        });
      }

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
      },
    });
    const response: AccountWithProfileDTO = {
      ...account,
      password: account.password || null,
      profile: plainToInstance(CustomerDTO, customer),
    };
    return response;
  }

  async getAccounts(
    filter: Prisma.AccountWhereInput,
    sortBy: string,
    orderBy: 'asc' | 'desc',
    page: number,
    pageSize: number
  ): Promise<PaginationResponse<AccountWithProfileDTO>> {
    try {
      const [total, accounts] = await this.prisma.$transaction([
        this.prisma.account.count({ where: filter }),
        this.prisma.account.findMany({
          where: filter,
          include: {
            customer: filter.role === AccountRole.CUSTOMER ? true : false,
            employee:
              filter.role === AccountRole.STAFF || filter.role === AccountRole.TECHNICIAN
                ? true
                : false,
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: buildAccountOrderBy(sortBy, orderBy, filter.role as AccountRole),
        }),
      ]);
      const accountDTOs = accounts.map(account => this.mapAccountToDTO(account));
      return {
        data: accountDTOs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException('Invalid query filter');
      }
      throw error;
    }
  }

  async getAccountById(id: string): Promise<AccountWithProfileDTO | null> {
    const account = await this.prisma.account.findUnique({
      where: { id: id },
      include: {
        customer: true,
        employee: true,
      },
    });

    if (!account) {
      return null;
    }

    return this.mapAccountToDTO(account);
  }

  mapAccountToDTO(account: any): AccountWithProfileDTO {
    let profile: Profile | null = null;

    switch (account.role) {
      case AccountRole.CUSTOMER:
      case AccountRole.PREMIUM:
        if (account.customer) {
          profile = plainToInstance(CustomerDTO, account.customer);
        }
        break;
      case AccountRole.STAFF:
      case AccountRole.TECHNICIAN:
        if (account.employee) {
          profile = plainToInstance(EmployeeDTO, account.employee);
        }
        break;
    }

    return {
      email: account.email,
      id: account.id,
      role: account.role,
      phone: account.phone,
      avatar: account.avatar,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      status: account.status,
      provider: account.provider,
      password: account.password || null,
      profile,
    };
  }

  async updateAccount(
    id: string,
    updateData: Partial<AccountWithProfileDTO>
  ): Promise<AccountWithProfileDTO> {
    const exists = await this.prisma.account.findUnique({
      where: { id },
      include: { customer: true, employee: true, admin: true },
    });
    if (!exists) throw new NotFoundException(`Account with id ${id} not found`);

    const accountData: Prisma.AccountUpdateInput = {
      ...(updateData.phone && { phone: updateData.phone }),
      ...(updateData.status && { status: updateData.status }),
    };

    if (exists.role === AccountRole.CUSTOMER && exists.customer) {
      const profile = { ...updateData } as CustomerDTO;
      accountData.customer = {
        update: {
          ...(profile.firstName && { firstName: profile.firstName }),
          ...(profile.lastName && { lastName: profile.lastName }),
          ...(profile.address && { address: profile.address }),
          ...(profile.isPremium !== undefined && { isPremium: profile.isPremium }),
        },
      };
    }

    if (
      (exists.role === AccountRole.STAFF || exists.role === AccountRole.TECHNICIAN) &&
      exists.employee
    ) {
      const profile = { ...updateData } as EmployeeDTO;
      accountData.employee = {
        update: {
          ...(profile.firstName && { firstName: profile.firstName }),
          ...(profile.lastName && { lastName: profile.lastName }),
        },
      };
    }

    const updated = await this.prisma.account.update({
      where: { id },
      data: accountData,
      include: { customer: true, employee: true, admin: true },
    });

    return this.mapAccountToDTO(updated);
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

  async uploadAvatar(accountId: string, avatar: Express.Multer.File) {
    const exists = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!exists) {
      throw new NotFoundException(`Account with id ${accountId} not found`);
    }
    const { secure_url, public_id } = await this.cloudinaryService.uploadImage(avatar, accountId);
    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        avatar: secure_url,
        avatarPublicId: public_id,
      },
    });
    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      avatar: updated.avatar,
    };
  }

  async changePassword(accountId: string, newPassword: string): Promise<void> {
    const exists = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!exists) {
      throw new NotFoundException(`Account with id ${accountId} not found`);
    }
    await this.prisma.account.update({
      where: { id: accountId },
      data: { password: newPassword },
    });
  }

  async getSubscriptionsByCustomerId(customerId: string): Promise<SubscriptionDTO | null> {
    const customer = await this.getAccountById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        customerId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        membership: true,
      },
    });
    if (!subscription) {
      return null;
    }
    return plainToInstance(SubscriptionDTO, subscription);
  }
}

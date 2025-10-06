import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AccountRole, Prisma } from '@prisma/client';
import { AccountWithProfileDTO } from '../account/dto/account-with-profile.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountService } from '../account/account.service';
import { CustomerQueryDTO } from './dto/customer-query.dto';
import { UpdateCustomerDTO } from './dto/update-customer.dto';
import { CustomerStatisticsDTO, CustomerStatisticsItemDTO } from './dto/customer-statistics.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly accountService: AccountService
  ) {}

  async createCustomer(newCustomer: CreateCustomerDTO) {
    const customer = await this.prismaService.customer.create({
      data: newCustomer,
    });
    return customer;
  }

  async getCustomers(
    filterOptions: CustomerQueryDTO
  ): Promise<PaginationResponse<AccountWithProfileDTO>> {
    let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = filterOptions;

    page < 1 && (page = 1);
    pageSize < 1 && (pageSize = 10);

    const where: Prisma.AccountWhereInput = {
      customer: {
        isPremium: filterOptions?.isPremium,
        firstName: { contains: filterOptions?.firstName, mode: 'insensitive' },
        lastName: { contains: filterOptions?.lastName, mode: 'insensitive' },
      },
      email: { contains: filterOptions?.email, mode: 'insensitive' },
      phone: filterOptions?.phone,
      status: filterOptions?.status,
      role: AccountRole.CUSTOMER,
    };

    return await this.accountService.getAccounts(where, sortBy, orderBy, page, pageSize);
  }

  async getCustomerById(id: string): Promise<AccountWithProfileDTO | null> {
    const account = await this.accountService.getAccountById(id);

    if (!account) {
      throw new BadRequestException('Account not found');
    }

    if (account.role !== AccountRole.CUSTOMER) {
      throw new BadRequestException('Account is not a customer');
    }
    return account;
  }

  async updateCustomer(id: string, updateData: UpdateCustomerDTO): Promise<AccountWithProfileDTO> {
    const customer = await this.accountService.updateAccount(id, updateData);
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    return await this.accountService.deleteAccount(id);
  }

  async getCustomerStatistics(): Promise<CustomerStatisticsDTO> {
    const [statusStats, premium, total] = await Promise.all([
      this.prismaService.account.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { role: AccountRole.CUSTOMER },
      }),

      this.prismaService.customer.count({ where: { isPremium: true } }),

      this.prismaService.account.count({ where: { role: AccountRole.CUSTOMER } }),
    ]);

    const safeDivide = (num: number, den: number) =>
      den === 0 ? 0 : Number(((num / den) * 100).toFixed(2));

    const data: CustomerStatisticsItemDTO[] = statusStats.map(s => ({
      status: s.status,
      count: s._count.status,
      percentage: safeDivide(s._count.status, total),
    }));

    return {
      total,
      premium: {
        count: premium,
        percentage: safeDivide(premium, total),
      },
      data,
    };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCustomerDTO } from './dto/create-customer.dto';
import { PrismaService } from '../prisma/prisma.service';
import { FilterOptionsDTO } from 'src/common/dto/filter-options.dto';
import { AccountRole, Prisma } from '@prisma/client';
import { AccountWithProfileDTO } from '../account/dto/account-with-profile.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { AccountService } from '../account/account.service';
import { AccountFilterDTO } from 'src/common/dto/account-filter.dto';
import { CustomerQueryDTO } from './dto/customer-query.dto';

@Injectable()
export class CustomerService {

    constructor(private readonly prismaService: PrismaService, private readonly accountService: AccountService) { }

    async createCustomer(newCustomer: CreateCustomerDTO) {
        const customer = await this.prismaService.customer.create({
            data: newCustomer
        })
        return customer;
    }

    async getCustomers(filterOptions: CustomerQueryDTO): Promise<PaginationResponse<AccountWithProfileDTO>> {
        let { page = 1, pageSize = 10, orderBy = 'asc', sortBy = 'createdAt' } = filterOptions;

        page < 1 && (page = 1);
        pageSize < 1 && (pageSize = 10);

        const where: Prisma.AccountWhereInput = {
            customer: {
                isPremium: filterOptions?.isPremium,
                firstName: filterOptions?.firstName,
                lastName: filterOptions?.lastName,
            },
            email: filterOptions?.email,
            phone: filterOptions?.phone,
            status: filterOptions?.status,
            role: AccountRole.CUSTOMER
        }

        return await this.accountService.getAccounts(
            where, sortBy, orderBy, page, pageSize
        )

    }
}

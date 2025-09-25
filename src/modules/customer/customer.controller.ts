import { Controller, Get, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AccountService } from '../account/account.service';
import { AccountRole } from '@prisma/client';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AccountFilterDTO } from 'src/common/dto/account-filter.dto';
import { FilterOptionsDTO } from 'src/common/dto/filter-options.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { CustomerQueryDTO } from './dto/customer-query.dto';
import { plainToInstance } from 'class-transformer';
import { AccountWithProfileDTO } from '../account/dto/account-with-profile.dto';

@ApiTags('Customers')
@ApiBearerAuth('jwt-auth')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService, private readonly accountService: AccountService) { }



  @Get('/')
  @Roles(AccountRole.ADMIN)
  async getCustomers(@Query() query: CustomerQueryDTO) {
    const { data, page, pageSize, total, totalPages } = await this.customerService.getCustomers(query)

    return {
      message: 'Accounts retrieved successfully',
      accounts: plainToInstance(AccountWithProfileDTO, data),
      page,
      pageSize,
      total,
      totalPages,
    };

  }
}
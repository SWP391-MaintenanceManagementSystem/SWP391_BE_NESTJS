import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { AccountService } from '../account/account.service';
import { AccountRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/role.decorator';
import { CustomerQueryDTO } from './dto/customer-query.dto';
import { plainToInstance } from 'class-transformer';
import { AccountWithProfileDTO } from '../account/dto/account-with-profile.dto';
import { UpdateCustomerDTO } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth('jwt-auth')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
    private readonly accountService: AccountService
  ) {}

  @Get('/')
  @Roles(AccountRole.ADMIN)
  async getCustomers(@Query() query: CustomerQueryDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.customerService.getCustomers(query);

    return {
      message: 'Accounts retrieved successfully',
      accounts: plainToInstance(AccountWithProfileDTO, data),
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  @Get('/:id')
  @Roles(AccountRole.ADMIN)
  async getCustomerById(@Query('id') id: string) {
    const account = await this.customerService.getCustomerById(id);

    return {
      message: 'Account retrieved successfully',
      account: plainToInstance(AccountWithProfileDTO, account),
    };
  }

  @Patch('/:id')
  @Roles(AccountRole.ADMIN)
  async updateCustomer(@Body() body: UpdateCustomerDTO, @Param('id') id: string) {
    const account = await this.customerService.updateCustomer(id, body);
    return {
      message: 'Update customer successfully',
      account: plainToInstance(AccountWithProfileDTO, account),
    };
  }
}

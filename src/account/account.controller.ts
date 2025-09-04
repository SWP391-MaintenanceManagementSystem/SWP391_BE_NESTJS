import { Body, Controller, Get, Query, Patch, Param, Delete } from '@nestjs/common';
import { AccountService } from './account.service';
import { ApiTags, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Account, Role } from '@prisma/client';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { CurrentUser } from 'src/decorator/current-user.decorator';
import { Roles } from 'src/decorator/role.decorator';

@ApiTags('Account')
@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get('/')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('jwt-auth')
  @ApiQuery({
    name: 'where',
    required: false,
    type: String,
    description: 'JSON string for filter conditions',
    example: '{"status":"VERIFIED"}',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'JSON string for sorting criteria',
    example: '{"createdAt":"desc"}',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of records per page',
    example: 10,
  })
  async getAccounts(
    @Query('where') where?: string,
    @Query('orderBy') orderBy?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const {
      data,
      page: _page,
      pageSize: _pageSize,
      total,
      totalPages,
    } = await this.accountService.getAccounts({
      where: where ? JSON.parse(where) : undefined,
      orderBy: orderBy ? JSON.parse(orderBy) : undefined,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 10,
    });
    return {
      message: 'Accounts retrieved successfully',
      accounts: data,
      page: _page,
      pageSize: _pageSize,
      total,
      totalPages,
    };
  }

  @Patch('/')
  @ApiBearerAuth('jwt-auth')
  @ApiBody({ type: UpdateAccountDTO })
  async updateAccount(@CurrentUser() user: Account, @Body() updateAccountDto: UpdateAccountDTO) {
    await this.accountService.updateAccount(user.accountId, updateAccountDto);
    return { message: 'Account updated successfully', status: 'success' };
  }

  @Delete('/:id')
  @ApiBearerAuth('jwt-auth')
  @Roles(Role.ADMIN)
  async deleteAccount(@Param('id') id: string) {
    await this.accountService.deleteAccount(id);
    return { message: 'Account deleted successfully', status: 'success' };
  }
}

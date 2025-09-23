import {
  Body,
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Delete,
  Post,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { ApiTags, ApiBody, ApiQuery, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Account, AccountRole } from '@prisma/client';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { Roles } from 'src/common/decorator/role.decorator';
import { JWT_Payload } from 'src/common/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
@ApiTags('Account')
@ApiBearerAuth('jwt-auth')
@Controller('api/account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }

  @Get('/')
  @Roles(AccountRole.ADMIN)
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
  @ApiBody({ type: UpdateAccountDTO })
  async updateAccount(@CurrentUser() user: Account, @Body() updateAccountDto: UpdateAccountDTO) {
    await this.accountService.updateAccount(user.id, updateAccountDto);
    return { message: 'Account updated successfully', status: 'success' };
  }

  @Delete('/:id')
  @Roles(AccountRole.ADMIN)
  async deleteAccount(@Param('id') id: string) {
    await this.accountService.deleteAccount(id);
    return { message: 'Account deleted successfully', status: 'success' };
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new BadRequestException('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
    })
  )
  @Post('avatar')
  async uploadAvatar(
    @CurrentUser() user: JWT_Payload,
    @UploadedFile() avatar: Express.Multer.File
  ) {
    await this.accountService.uploadAvatar(user.sub, avatar);
    return { message: 'Avatar uploaded successfully' };
  }
}

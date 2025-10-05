import {
  Body,
  Controller,
  Patch,
  Param,
  Delete,
  Post,
  UploadedFile,
  BadRequestException,
  Get,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { ApiTags, ApiBody, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AccountRole } from '@prisma/client';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { Roles } from 'src/common/decorator/role.decorator';
import { JWT_Payload } from 'src/common/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors } from '@nestjs/common';
import { AccountWithProfileDTO } from './dto/account-with-profile.dto';
import { plainToInstance } from 'class-transformer';
import { VehicleService } from '../vehicle/vehicle.service';
import { SubscriptionService } from '../subscription/subscription.service';
@ApiTags('Me')
@ApiBearerAuth('jwt-auth')
@Controller('api/me')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly vehicleService: VehicleService
  ) {}

  // @Get('/')
  // @Roles(AccountRole.ADMIN)
  // @ApiQuery({
  //   name: 'where',
  //   required: false,
  //   type: String,
  //   description: 'JSON string for filter conditions',
  //   example: '{"status":"VERIFIED"}',
  // })
  // @ApiQuery({
  //   name: 'orderBy',
  //   required: false,
  //   type: String,
  //   description: 'JSON string for sorting criteria',
  //   example: '{"createdAt":"desc"}',
  // })
  // @ApiQuery({
  //   name: 'page',
  //   required: false,
  //   type: Number,
  //   description: 'Page number',
  //   example: 1,
  // })
  // @ApiQuery({
  //   name: 'pageSize',
  //   required: false,
  //   type: Number,
  //   description: 'Number of records per page',
  //   example: 10,
  // })
  // async getAccounts(
  //   @Query('where') where?: string,
  //   @Query('orderBy') orderBy?: string,
  //   @Query('page') page?: string,
  //   @Query('pageSize') pageSize?: string
  // ) {
  //   const {
  //     data,
  //     page: _page,
  //     pageSize: _pageSize,
  //     total,
  //     totalPages,
  //   } = await this.accountService.getAccounts({
  //     where: where ? JSON.parse(where) : undefined,
  //     orderBy: orderBy ? JSON.parse(orderBy) : undefined,
  //     page: page ? parseInt(page) : 1,
  //     pageSize: pageSize ? parseInt(pageSize) : 10,
  //   });
  //   return {
  //     message: 'Accounts retrieved successfully',
  //     accounts: plainToInstance(AccountWithProfileDTO, data),
  //     page: _page,
  //     pageSize: _pageSize,
  //     total,
  //     totalPages,
  //   };
  // }

  @Patch('/')
  async updateAccount(
    @CurrentUser() user: JWT_Payload,
    @Body() updateAccountDto: UpdateAccountDTO
  ) {
    const data = await this.accountService.updateAccount(user.sub, updateAccountDto);
    return {
      message: 'Account updated successfully',
      data: plainToInstance(AccountWithProfileDTO, data),
    };
  }

  // @Delete('/:id')
  // @Roles(AccountRole.ADMIN)
  // async deleteAccount(@Param('id') id: string) {
  //   await this.accountService.deleteAccount(id);
  //   return { message: 'Account deleted successfully' };
  // }

  @Get('/vehicles')
  @Roles(AccountRole.CUSTOMER)
  async getMyVehicles(@CurrentUser() user: JWT_Payload) {
    const vehicles = await this.vehicleService.getVehiclesByCustomer(user.sub);
    return {
      message: 'Vehicles retrieved successfully',
      data: vehicles,
    };
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

  @Get('subscription')
  @Roles(AccountRole.CUSTOMER)
  async getMySubscription(@CurrentUser() user: JWT_Payload) {
    const subscription = await this.accountService.getSubscriptionsByCustomerId(user.sub);
    if (!subscription) {
      return {
        message: 'No active subscription found',
      };
    }
    return {
      message: 'Subscription retrieved successfully',
      data: subscription,
    };
  }
}

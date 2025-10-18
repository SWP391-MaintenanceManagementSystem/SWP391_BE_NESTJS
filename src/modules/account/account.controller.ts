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
@ApiTags('Me')
@ApiBearerAuth('jwt-auth')
@Controller('api/me')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly vehicleService: VehicleService
  ) {}

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

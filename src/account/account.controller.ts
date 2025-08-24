import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Serialize } from 'src/interceptor/serialize.interceptor';
import { AccountDTO } from './dto/account.dto';
import { VerifiedGuard } from 'src/guard/verified.guard';
import { CurrentUser } from 'src/decorator/current-user.decorator';

@Controller('account')
@UseGuards(VerifiedGuard)

export class AccountController {
  @Get('me')
  @Serialize(AccountDTO)
  getProfile(@CurrentUser() user: AccountDTO) {
    return user;
  }
}

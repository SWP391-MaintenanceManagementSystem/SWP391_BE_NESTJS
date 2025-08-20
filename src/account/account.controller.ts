import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Serialize } from 'src/interceptor/serialize.interceptor';
import { AccountDTO } from './dto/account.dto';

@Controller('account')
export class AccountController {
  @Get('me')
  @Serialize(AccountDTO)
  getProfile(@Req() req: Request) {
    return req.user;
  }
}

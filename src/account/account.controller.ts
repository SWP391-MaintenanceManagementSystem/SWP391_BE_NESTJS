import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('account')
export class AccountController {
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}

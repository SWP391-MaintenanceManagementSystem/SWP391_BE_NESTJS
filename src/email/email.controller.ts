import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from 'src/auth/decorator/public';


@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }
  // @Public()
  // @Get('test')
  // async testEmail() {
  //   await this.emailService.testMail();
  //   return "ok"
  // }
}

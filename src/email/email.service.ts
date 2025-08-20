import { Get, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Public } from 'src/decorator/public.decorator';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) { }



  @Public()
  @Get('send-verification-email')
  async sendActivationEmail(email: string, username: string, activationCode: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email',
      template: 'verification_email',
      context: {
        username: username ?? email,
        activationCode,
        year: new Date().getFullYear(),
      }
    });
  }
}

import { Get, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Public } from 'src/auth/decorator/public';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) { }

  async testMail() {
    await this.mailerService.sendMail({
      to: 'lamtailoi11141@gmail.com',
      subject: 'Activate mail',
      text: 'This is a test email',
      template: 'activate_mail',
      context: {
        username: 'John Doe',
        activationCode: '123456',
        year: new Date().getFullYear(),
      }
    });
  }

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

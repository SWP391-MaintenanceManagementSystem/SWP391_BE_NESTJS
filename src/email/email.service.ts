import { Get, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) { }


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

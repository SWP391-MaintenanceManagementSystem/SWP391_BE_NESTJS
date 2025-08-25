import { Get, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService, private configService: ConfigService) { }


  async sendActivationEmail(email: string, username: string, activationCode: string) {
    const host = this.configService.get('HOST');
    const port = this.configService.get('PORT');
    const activationLink = `http://${host}:${port}/auth/verify-email?code=${activationCode}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email',
      template: 'verification_email',
      context: {
        username: username ?? email,
        activationCode,
        year: new Date().getFullYear(),
        activationLink,
      }
    });
  }
}

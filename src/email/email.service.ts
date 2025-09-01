import { Get, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService, private configService: ConfigService) { }


  async sendActivationEmail(email: string, username: string, activationCode: string) {
    const host = this.configService.get('HOST');
    const port = this.configService.get('PORT');
    const activationLink = `http://localhost:${port}/api/auth/verify-email?code=${activationCode}`;
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

  async sendResetPasswordEmail(email: string, username: string, resetCode: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Reset your password',
      template: 'reset_password_email',
      context: {
        username: username ?? email,
        resetCode,
        year: new Date().getFullYear(),
      }
    });
  }

}

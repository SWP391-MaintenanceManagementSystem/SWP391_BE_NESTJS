import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountModule } from 'src/modules/account/account.module';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from 'src/modules/auth/passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';
import { GoogleOauth2 } from './passport/google.strategy';
import { ConfigService } from '@nestjs/config';
import { EmailModule } from 'src/modules/email/email.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    AccountModule,
    CustomerModule,
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('AC_SECRET'),
        signOptions: {
          expiresIn: config.get('AC_EXPIRE_TIME'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, LocalStrategy, JwtStrategy, GoogleOauth2],
  exports: [AuthService],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { EmailModule } from './modules/email/email.module';
import { RedisModule } from './modules/redis/redis.module';
import { RoleGuard } from './common/guard/role.guard';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { CustomerModule } from './modules/customer/customer.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { UploadModule } from './modules/upload/upload.module';
import { StaffModule } from './modules/employee/staff/staff.module';
import { TechnicianModule } from './modules/employee/technician/technician.module';
import { MembershipModule } from './modules/membership/membership.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`,
    }),
    UploadModule,
    AccountModule,
    AuthModule,
    PrismaModule,
    ScheduleModule,
    RedisModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: '"No Reply" <no-reply@example.com>',
        },
        template: {
          dir: process.cwd() + '/src/modules/email/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            inlineCss: true,
            strict: true,
          },
        },
      }),
    }),
    EmailModule,
    RedisModule,
    CustomerModule,
    TechnicianModule,
    VehicleModule,
    StaffModule,
    MembershipModule,
    StripeModule.forRoot(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-09-30.clover' }),
    SubscriptionModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

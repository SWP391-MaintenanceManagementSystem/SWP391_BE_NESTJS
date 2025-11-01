import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import * as dateFns from 'date-fns';
import { EmailService } from '../email/email.service';
import { CustomerService } from '../customer/customer.service';
import { SubscriptionStatus } from '@prisma/client';
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly customerService: CustomerService
  ) {}

  // @Cron(CronExpression.EVERY_5_SECONDS)
  // handleCron() {
  //     this.logger.debug('Cron job chạy mỗi 5 giây');
  // }

  @Cron(CronExpression.EVERY_HOUR, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleRemoveExpireToken() {
    this.logger.debug('DELETE EXPIRED TOKEN');
    await this.prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleExpireMembership() {
    this.logger.debug('EXPIRE MEMBERSHIP');
    const now = new Date();
    const updated = await this.prisma.subscription.updateMany({
      where: {
        endDate: {
          lt: now,
        },
        status: 'ACTIVE',
      },
      data: {
        status: 'EXPIRED',
      },
    });
    await this.prisma.customer.updateMany({
      where: {
        isPremium: true,
        subscriptions: {
          none: { status: 'ACTIVE' },
        },
      },
      data: {
        isPremium: false,
      },
    });
    this.logger.debug(`Expired ${updated.count} memberships`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleSendRenewMembershipEmail() {
    this.logger.debug('SEND REMIND RENEW MEMBERSHIP EMAIL');
    const now = new Date();
    const remindDate = dateFns.addDays(now, 7);
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        endDate: {
          gte: now,
          lte: remindDate,
        },
        status: 'ACTIVE',
      },
      include: {
        customer: true,
        membership: true,
      },
    });
    for (const subscription of subscriptions) {
      const customer = await this.customerService.getCustomerById(subscription.customerId);
      if (customer) {
        const fullName = `${customer.profile?.firstName} ${customer.profile?.lastName}`;
        await this.emailService.sendRemindRenewMembershipEmail(
          customer.email,
          fullName,
          dateFns.format(subscription.endDate, 'dd/MM/yyyy')
        );
        this.logger.debug(`Send email to ${customer.email} successfully`);
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleActivatePendingMemberships() {
    this.logger.debug('ACTIVATE PENDING MEMBERSHIPS');
    const now = new Date();

    const toActivate = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.INACTIVE,
        startDate: { lte: now },
      },
      include: { customer: true },
    });

    if (toActivate.length === 0) {
      this.logger.debug('No subscriptions to activate.');
      return;
    }

    const updated = await this.prisma.subscription.updateMany({
      where: {
        status: SubscriptionStatus.INACTIVE,
        startDate: { lte: now },
      },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });

    await this.prisma.customer.updateMany({
      where: {
        accountId: {
          in: toActivate.map(s => s.customerId),
        },
      },
      data: {
        isPremium: true,
      },
    });

    this.logger.debug(`Activated ${updated.count} pending subscriptions.`);
  }
}

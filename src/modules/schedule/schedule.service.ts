import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import * as dateFns from 'date-fns';
import { EmailService } from '../email/email.service';
import { CustomerService } from '../customer/customer.service';
import { BookingStatus, NotificationType, SubscriptionStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { encodeBase64 } from 'src/utils';
import { toZonedTime } from 'date-fns-tz';
import { RemindFlags, RemindStage, VN_TIMEZONE } from 'src/common/constants';
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly customerService: CustomerService,
    private readonly notificationService: NotificationService
  ) {}

  // @Cron(CronExpression.EVERY_5_SECONDS)
  // handleCron() {
  //     this.logger.debug('Cron job chạy mỗi 5 giây');
  // }

  @Cron(CronExpression.EVERY_HOUR, { timeZone: VN_TIMEZONE })
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: VN_TIMEZONE })
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: VN_TIMEZONE })
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
    const tasks = subscriptions.map(async subscription => {
      const customer = await this.customerService.getCustomerById(subscription.customerId);
      if (!customer) return;

      const fullName = `${customer.profile?.firstName} ${customer.profile?.lastName}`;
      const formattedDate = dateFns.format(subscription.endDate, 'dd/MM/yyyy');

      await Promise.all([
        this.emailService.sendRemindRenewMembershipEmail(customer.email, fullName, formattedDate),
        this.notificationService.sendNotification(
          customer.id,
          `Your ${subscription.membership.name} membership will expire on ${formattedDate}. Please consider renewing it to continue enjoying our services.`,
          NotificationType.MEMBERSHIP,
          'Membership Renewal Reminder'
        ),
      ]);

      this.logger.debug(`Send email to ${customer.email} successfully`);
    });
    await Promise.all(tasks);
  }

  @Cron(CronExpression.EVERY_HOUR, { timeZone: VN_TIMEZONE })
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

  @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: VN_TIMEZONE })
  async bookingReminder() {
    this.logger.debug('SEND BOOKING REMINDER NOTIFICATIONS');
    const now = new Date();
    const stages = [
      { stage: RemindStage.BEFORE_24H, offsetHours: 24 },
      { stage: RemindStage.BEFORE_1H, offsetHours: 1 },
    ];

    const maxOffset = Math.max(...stages.map(s => s.offsetHours));
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.ASSIGNED, BookingStatus.PENDING] },
        bookingDate: {
          gte: now,
          lte: dateFns.addHours(now, maxOffset + 1),
        },
      },
      include: {
        serviceCenter: { select: { name: true, address: true } },
        customer: { include: { account: { select: { email: true, id: true } } } },
      },
    });

    if (!bookings.length) {
      this.logger.debug('No bookings to send reminders for.');
      return;
    }

    const tasks = bookings.map(async booking => {
      const flags: RemindFlags = (booking.reminded as RemindFlags) || {
        [RemindStage.BEFORE_24H]: false,
        [RemindStage.BEFORE_1H]: false,
      };

      const customer = booking.customer;
      if (!customer) return;

      const fullName = `${customer.firstName} ${customer.lastName}`;
      const zonedTime = toZonedTime(booking.bookingDate, VN_TIMEZONE);
      const formattedDate = dateFns.format(zonedTime, 'dd/MM/yyyy');
      const formattedTime = dateFns.format(zonedTime, 'HH:mm');

      let updated = false;

      for (const { stage, offsetHours } of stages) {
        const remindWindowStart = dateFns.addHours(booking.bookingDate, -offsetHours);
        const remindWindowEnd = dateFns.addMinutes(remindWindowStart, 60);
        if (!flags[stage] && now >= remindWindowStart && now <= remindWindowEnd) {
          await this.emailService.sendBookingReminderEmail({
            email: customer.account.email,
            username: fullName,
            bookingDate: formattedDate,
            bookingTime: formattedTime,
            centerName: booking.serviceCenter.name,
            location: booking.serviceCenter.address,
            bookingDetailsURL: `http://localhost:5173/booking/${encodeBase64(booking.id)}`,
          });

          await this.notificationService.sendNotification(
            customer.account.id,
            `Dear ${fullName}, this is a reminder for your upcoming booking scheduled at ${formattedDate} ${formattedTime}. We look forward to serving you!`,
            NotificationType.BOOKING,
            'Booking Reminder'
          );
          flags[stage] = true;
          updated = true;
          this.logger.debug(
            `Sent booking reminder (${stage}) to customer ID ${customer.account.id}`
          );
        }
      }

      if (updated) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { reminded: flags },
        });
      }
    });

    await Promise.all(tasks);
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { timeZone: VN_TIMEZONE })
  async handleAutoCancelNoShowBooking() {
    this.logger.debug('AUTO-CANCEL BOOKING IF NOT CHECKED-IN AFTER 30 MIN');

    const now = new Date();
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.ASSIGNED] },
        bookingDate: { lt: dateFns.subMinutes(now, 30) },
      },
      include: { customer: { include: { account: true } } },
    });

    if (!expiredBookings.length) return;

    const tasks = expiredBookings.map(async booking => {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          note: 'Auto-cancel: customer did not check in within 30 minutes',
        },
      });

      // if (booking.customer?.account?.email) {
      //   const fullName = `${booking.customer.profile?.firstName ?? ''} ${booking.customer.profile?.lastName ?? ''}`;
      //   await this.emailService.sendBookingCancelledEmail(
      //     booking.customer.account.email,
      //     fullName,
      //     dateFns.format(booking.bookingDate, 'dd/MM/yyyy HH:mm')
      //   );
      // }
      await this.notificationService.sendNotification(
        booking.customer.account.id,
        `Your booking scheduled at ${dateFns.format(booking.bookingDate, 'dd/MM/yyyy HH:mm')} has been cancelled due to no check-in within 30 minutes.`,
        NotificationType.BOOKING,
        'Booking Cancelled'
      );
      this.logger.debug(
        `Auto-cancelled booking ID ${booking.id} for customer ID ${booking.customerId}`
      );
    });

    await Promise.all(tasks);
  }
}

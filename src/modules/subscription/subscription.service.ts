import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import * as dateFns from 'date-fns';
import { SubscriptionStatus } from '@prisma/client';
import { MembershipService } from '../membership/membership.service';
import { convertToPeriod } from '../../utils';
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly membershipService: MembershipService
  ) {}

  async createSubscription(membershipId: string, customerId: string) {
    const membership = await this.membershipService.getMembershipById(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }
    const startDate = new Date();
    const endDate = convertToPeriod(membership.periodType, membership.duration, startDate);
    const subscription = await this.prismaService.subscription.create({
      data: {
        membershipId,
        customerId,
        startDate,
        endDate,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    return subscription;
  }

  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
    const subscription = await this.prismaService.subscription.update({
      where: { id: subscriptionId },
      data: { status },
    });
    return subscription;
  }
}

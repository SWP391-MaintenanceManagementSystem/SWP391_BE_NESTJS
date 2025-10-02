import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import * as dateFns from 'date-fns';
import { Prisma, SubscriptionStatus } from '@prisma/client';
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
      throw new NotFoundException('Membership not found');
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

  async updateSubscriptionStatus(
    subscriptionId: string,
    updateField: Prisma.SubscriptionUpdateInput
  ) {
    const subscription = await this.prismaService.subscription.update({
      where: { id: subscriptionId },
      data: updateField,
    });
    return subscription;
  }

  async updateOrCreateSubscription(membershipId: string, customerId: string) {
    const existingSubscription = await this.prismaService.subscription.findFirst({
      where: {
        membershipId,
        customerId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      const membership = await this.membershipService.getMembershipById(membershipId);
      if (!membership) {
        throw new NotFoundException('Membership not found');
      }
      const newEndDate = convertToPeriod(
        membership.periodType,
        membership.duration,
        existingSubscription.endDate
      );
      return this.updateSubscriptionStatus(existingSubscription.id, {
        endDate: newEndDate,
      });
    } else {
      return this.createSubscription(membershipId, customerId);
    }
  }
}

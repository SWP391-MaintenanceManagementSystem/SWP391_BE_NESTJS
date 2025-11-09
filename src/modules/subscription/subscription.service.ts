import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SubscriptionStatus } from '@prisma/client';
import { MembershipService } from '../membership/membership.service';
import { convertToPeriod } from '../../utils';
import { CustomerService } from '../customer/customer.service';
import { plainToInstance } from 'class-transformer';
import { SubscriptionDTO } from './dto/subscription.dto';
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly customerService: CustomerService
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
    await this.prismaService.customer.update({
      where: { accountId: customerId },
      data: { isPremium: true },
    });
    return subscription;
  }

  async updateSubscription(subscriptionId: string, updateField: Prisma.SubscriptionUpdateInput) {
    const subscription = await this.prismaService.subscription.update({
      where: { id: subscriptionId },
      data: updateField,
    });
    return subscription;
  }

  // async updateOrCreateSubscription(membershipId: string, customerId: string) {
  //   const existingSubscription = await this.prismaService.subscription.findFirst({
  //     where: {
  //       membershipId,
  //       customerId,
  //       status: SubscriptionStatus.ACTIVE,
  //     },
  //     include: {
  //       customer: true,
  //       membership: true,
  //     },
  //   });

  //   if (existingSubscription) {
  //     const membership = await this.membershipService.getMembershipById(membershipId);
  //     if (!membership) {
  //       throw new NotFoundException('Membership not found');
  //     }
  //     const newEndDate = convertToPeriod(
  //       membership.periodType,
  //       membership.duration,
  //       existingSubscription.endDate
  //     );
  //     const updated = await this.updateSubscription(existingSubscription.id, {
  //       endDate: newEndDate,
  //     });
  //     await this.prismaService.customer.update({
  //       where: { accountId: customerId },
  //       data: { isPremium: true },
  //     });
  //     return updated;
  //   } else {
  //     return this.createSubscription(membershipId, customerId);
  //   }
  // }

  async updateOrCreateSubscription(membershipId: string, customerId: string) {
    const activeSubs = await this.prismaService.subscription.findMany({
      where: { customerId, status: SubscriptionStatus.ACTIVE },
    });

    const membership = await this.membershipService.getMembershipById(membershipId);
    if (!membership) throw new NotFoundException('Membership not found');
    if (activeSubs.length === 0) {
      const sub = await this.createSubscription(membershipId, customerId);
      await this.prismaService.customer.update({
        where: { accountId: customerId },
        data: { isPremium: true },
      });
      return plainToInstance(SubscriptionDTO, sub);
    }

    const sameMembership = activeSubs.find(sub => sub.membershipId === membershipId);
    if (sameMembership) {
      const newEndDate = convertToPeriod(
        membership.periodType,
        membership.duration,
        sameMembership.endDate
      );

      const updated = await this.updateSubscription(sameMembership.id, { endDate: newEndDate });
      return updated;
    }

    const latestEnd = activeSubs.reduce(
      (latest, s) => (s.endDate > latest ? s.endDate : latest),
      activeSubs[0].endDate
    );

    const startDate = latestEnd > new Date() ? latestEnd : new Date();
    const endDate = convertToPeriod(membership.periodType, membership.duration, startDate);

    const newSub = await this.prismaService.subscription.create({
      data: {
        membershipId,
        customerId,
        startDate,
        endDate,
        status: SubscriptionStatus.INACTIVE,
      },
    });

    const hasActive = activeSubs.length > 0;
    if (hasActive) {
      await this.prismaService.customer.update({
        where: { accountId: customerId },
        data: { isPremium: true },
      });
    }

    return plainToInstance(SubscriptionDTO, newSub);
  }

  async getSubscriptionByCustomerId(customerId: string) {
    const subscription = await this.prismaService.subscription.findFirst({
      where: {
        customerId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        customer: true,
        membership: true,
      },
    });
    return subscription;
  }
}

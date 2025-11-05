import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class CustomerDashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBookingTotal(customerId: string): Promise<number> {
    return this.prismaService.booking.count({
      where: { customerId, NOT: { status: 'CANCELLED' } },
    });
  }

  async getBookingStatusSummary(customerId: string) {
    const [pending, inProgress, completed] = await Promise.all([
      this.prismaService.booking.count({
        where: { customerId, status: { in: ['PENDING', 'ASSIGNED'] } },
      }),
      this.prismaService.booking.count({
        where: { customerId, status: { in: ['CHECKED_IN', 'IN_PROGRESS'] } },
      }),
      this.prismaService.booking.count({
        where: { customerId, status: { in: ['CHECKED_OUT', 'COMPLETED'] } },
      }),
    ]);

    const total = pending + inProgress + completed || 1;

    return [
      {
        status: 'PENDING',
        count: pending,
        percentage: Number(((pending / total) * 100).toFixed(2)),
      },
      {
        status: 'IN_PROGRESS',
        count: inProgress,
        percentage: Number(((inProgress / total) * 100).toFixed(2)),
      },
      {
        status: 'COMPLETED',
        count: completed,
        percentage: Number(((completed / total) * 100).toFixed(2)),
      },
    ];
  }

  async getTotalSpending(customerId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOf12Months = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [weekSpending, monthSpending, yearSpending] = await Promise.all([
      this.prismaService.transaction.aggregate({
        where: {
          customerId,
          status: TransactionStatus.SUCCESS,
          createdAt: { gte: startOfWeek },
        },
        _sum: { amount: true },
      }),

      this.prismaService.transaction.aggregate({
        where: {
          customerId,
          status: TransactionStatus.SUCCESS,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),

      this.prismaService.transaction.aggregate({
        where: {
          customerId,
          status: TransactionStatus.SUCCESS,
          createdAt: { gte: startOf12Months },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      week: weekSpending._sum.amount ?? 0,
      month: monthSpending._sum.amount ?? 0,
      year: yearSpending._sum.amount ?? 0,
    };
  }

  async getBookingsByCenter(customerId: string) {
    const grouped = await this.prismaService.booking.groupBy({
      by: ['centerId'],
      where: { customerId, NOT: { status: 'CANCELLED' } },
      _count: { centerId: true },
    });

    if (!grouped.length) return [];

    const centers = await this.prismaService.serviceCenter.findMany({
      where: { id: { in: grouped.map(g => g.centerId) } },
      select: { id: true, name: true },
    });

    const total = grouped.reduce((sum, g) => sum + g._count.centerId, 0);

    return grouped.map(g => {
      const center = centers.find(c => c.id === g.centerId);
      return {
        center: center?.name ?? 'Unknown Center',
        count: g._count.centerId,
        percentage: Number(((g._count.centerId / total) * 100).toFixed(2)),
      };
    });
  }

  async getOverview(customerId: string) {
    const [bookingTotal, bookingStatusSummary, totalSpending, bookingsByCenter] = await Promise.all(
      [
        this.getBookingTotal(customerId),
        this.getBookingStatusSummary(customerId),
        this.getTotalSpending(customerId),
        this.getBookingsByCenter(customerId),
      ]
    );

    return {
      bookingTotal,
      bookingStatusSummary,
      totalSpending,
      bookingsByCenter,
    };
  }
}

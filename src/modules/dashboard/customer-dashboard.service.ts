import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { SpendingSummaryDTO } from './dto/customer-dashboard-overview.dto';

@Injectable()
export class CustomerDashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getBookingTotal(customerId: string): Promise<number> {
    return this.prismaService.booking.count({
      where: { customerId, NOT: { status: 'CANCELLED' } },
    });
  }

  async getBookingStatusSummary(customerId: string) {
    const [pending, inProgress, finished] = await Promise.all([
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

    const total = pending + inProgress + finished || 1;

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
        status: 'FINISHED',
        count: finished,
        percentage: Number(((finished / total) * 100).toFixed(2)),
      },
    ];
  }

  // ===================== UTILS =====================

  private getWeekRange() {
    const now = new Date();
    const start = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    start.setDate(now.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private getYearRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  private async aggregateSpending(customerId: string) {
    const result = await this.prismaService.transaction.aggregate({
      where: {
        customerId,
        status: TransactionStatus.SUCCESS,
      },
      _sum: { amount: true },
      _avg: { amount: true },
      _max: { amount: true, createdAt: true },
    });
    return {
      total: result._sum.amount ?? 0,
      average: result._avg.amount ?? 0,
      peak: {
        key: result._max.createdAt ? result._max.createdAt.toISOString().split('T')[0] : '',
        amount: result._max.amount ?? 0,
      },
    };
  }

  private async getGroupedSpending(customerId: string, range: { start: Date; end: Date }) {
    const raw = await this.prismaService.transaction.groupBy({
      by: ['createdAt'],
      where: {
        customerId,
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: range.start, lte: range.end },
      },
      _sum: { amount: true },
    });

    const map: Record<string, number> = {};
    for (const t of raw) {
      const key = t.createdAt.toISOString().split('T')[0];
      map[key] = (map[key] ?? 0) + (t._sum.amount ?? 0);
    }
    return map;
  }

  async getTotalSpending(customerId: string) {
    const { start: weekStart, end: weekEnd } = this.getWeekRange();
    const { start: monthStart, end: monthEnd } = this.getMonthRange();
    const { start: yearStart, end: yearEnd } = this.getYearRange();
    const now = new Date();

    // week
    const weekMap = await this.getGroupedSpending(customerId, { start: weekStart, end: weekEnd });
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = d.toISOString().split('T')[0];
      return { key, amount: weekMap[key] ?? 0 };
    });

    // month
    const monthMap = await this.getGroupedSpending(customerId, {
      start: monthStart,
      end: monthEnd,
    });
    const daysInMonth = monthEnd.getDate();
    const month = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const key = d.toISOString().split('T')[0];
      return { key, amount: monthMap[key] ?? 0 };
    });

    // year
    const yearRaw = await this.prismaService.transaction.groupBy({
      by: ['createdAt'],
      where: {
        customerId,
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      _sum: { amount: true },
    });

    const yearMap: Record<number, number> = {};
    for (const t of yearRaw) {
      const monthIndex = t.createdAt.getMonth();
      yearMap[monthIndex] = (yearMap[monthIndex] ?? 0) + (t._sum.amount ?? 0);
    }
    const year = Array.from({ length: 12 }, (_, i) => ({
      key: String(i + 1),
      amount: yearMap[i] ?? 0,
    }));

    // overall aggregation
    const overall = await this.aggregateSpending(customerId);

    return plainToInstance(SpendingSummaryDTO, {
      week,
      month,
      year,
      ...overall,
    });
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

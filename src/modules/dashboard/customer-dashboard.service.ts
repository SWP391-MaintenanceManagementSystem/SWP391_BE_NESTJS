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

    // === WEEK RANGE ===
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1; // Monday = 0
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // === MONTH RANGE ===
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    // === YEAR RANGE ===
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);

    // ===================== WEEK =====================
    const weekRaw = await this.prismaService.transaction.groupBy({
      by: ['createdAt'],
      where: {
        customerId,
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: startOfWeek, lte: endOfWeek },
      },
      _sum: { amount: true },
    });

    const weekMap: Record<string, number> = {};
    for (const t of weekRaw) {
      const key = t.createdAt.toISOString().split('T')[0];
      weekMap[key] = (weekMap[key] ?? 0) + (t._sum.amount ?? 0);
    }

    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = d.toISOString().split('T')[0];
      return {
        key,
        amount: weekMap[key] ?? 0,
      };
    });

    const monthRaw = await this.prismaService.transaction.groupBy({
      by: ['createdAt'],
      where: {
        customerId,
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    });

    const monthMap: Record<string, number> = {};
    for (const t of monthRaw) {
      const key = t.createdAt.toISOString().split('T')[0];
      monthMap[key] = (monthMap[key] ?? 0) + (t._sum.amount ?? 0);
    }

    const daysInMonth = endOfMonth.getDate();
    const month = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
      const key = d.toISOString().split('T')[0];
      return {
        key,
        amount: monthMap[key] ?? 0,
      };
    });

    const yearRaw = await this.prismaService.transaction.groupBy({
      by: ['createdAt'],
      where: {
        customerId,
        status: TransactionStatus.SUCCESS,
        createdAt: { gte: startOfYear, lte: endOfYear },
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

    return plainToInstance(SpendingSummaryDTO, {
      week,
      month,
      year,
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

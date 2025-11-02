import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { toZonedTime, format } from 'date-fns-tz';
import { subDays } from 'date-fns';
import { DashboardSummaryDTO } from './dto/dashboard-summary.dto';
import { RevenueStatsDTO } from './dto/revenue-stats.dto';
import { InventoryStatusDTO } from './dto/inventory-status.dto';
import { ServiceCenterStatsDTO } from './dto/service-center-stats.dto';
import { TrendingSummaryDTO } from './dto/trending-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}


 async getSummary(): Promise<DashboardSummaryDTO> {
  const timeZone = 'Asia/Ho_Chi_Minh';
  const nowVN = toZonedTime(new Date(), timeZone);

  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 7 : d.getDay(); // nếu CN thì tính là ngày 7
    d.setDate(d.getDate() - (day - 1)); // về đầu tuần (thứ 2)
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const endOfWeek = (date: Date) => {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const startThisWeek = startOfWeek(nowVN);
  const endThisWeek = endOfWeek(nowVN);
  const startLastWeek = new Date(startThisWeek);
  startLastWeek.setDate(startThisWeek.getDate() - 7);
  const endLastWeek = new Date(endThisWeek);
  endLastWeek.setDate(endThisWeek.getDate() - 7);

  const [
    totalRevenueAggregate,
    revenueThisWeek,
    revenueLastWeek,
    customersThisWeek,
    customersLastWeek,
    employeesThisWeek,
    employeesLastWeek,
    totalCustomers,
    totalEmployees,
    totalCenters,
  ] = await Promise.all([

    this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    }),


    this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startThisWeek, lte: endThisWeek },
      },
    }),

    this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESS',
        createdAt: { gte: startLastWeek, lte: endLastWeek },
      },
    }),


    this.prisma.customer.count({
      where: {
        createdAt: { gte: startThisWeek, lte: endThisWeek },
        account: { status: 'VERIFIED' },
      },
    }),


    this.prisma.customer.count({
      where: {
        createdAt: { gte: startLastWeek, lte: endLastWeek },
        account: { status: 'VERIFIED' },
      },
    }),


    this.prisma.employee.count({
      where: {
        createdAt: { gte: startThisWeek, lte: endThisWeek },
        account: { status: 'VERIFIED' },
      },
    }),


    this.prisma.employee.count({
      where: {
        createdAt: { gte: startLastWeek, lte: endLastWeek },
        account: { status: 'VERIFIED' },
      },
    }),


    this.prisma.customer.count({
      where: { account: { status: 'VERIFIED' } },
    }),


    this.prisma.employee.count({
      where: { account: { status: 'VERIFIED' } },
    }),


    this.prisma.serviceCenter.count(),
  ]);

  const calcGrowth = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

  return {
    totalRevenue: Number(totalRevenueAggregate._sum.amount ?? 0),
    totalCustomers,
    totalEmployees,
    totalServiceCenters: totalCenters,
    revenueGrowthRate: calcGrowth(
      Number(revenueThisWeek._sum.amount ?? 0),
      Number(revenueLastWeek._sum.amount ?? 0),
    ),
    customerGrowthRate: calcGrowth(customersThisWeek, customersLastWeek),
    employeeGrowthRate: calcGrowth(employeesThisWeek, employeesLastWeek),
  };
}


  async getRevenueByDate(period?: string): Promise<RevenueStatsDTO> {
    const timeZone = 'Asia/Ho_Chi_Minh';
    const now = toZonedTime(new Date(), timeZone);

    const rangeMap: Record<string, number> = {
      '1d': 1,
      '3d': 3,
      '1w': 7,
      '1m': 30,
      '3m': 90,
    };

    const days = rangeMap[period ?? '3m'] ?? 90;
    const start = subDays(now, days);

    const transactions = await this.prisma.transaction.findMany({
      where: { status: 'SUCCESS', createdAt: { gte: start, lte: now } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyRevenue = new Map<string, number>();
    for (const t of transactions) {
      const localDate = format(toZonedTime(t.createdAt, timeZone), 'yyyy-MM-dd');
      dailyRevenue.set(localDate, (dailyRevenue.get(localDate) || 0) + Number(t.amount));
    }

    const data = Array.from(dailyRevenue.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, totalRevenue]) => ({ date, totalRevenue }));

    return { range: period ?? '3m', data };
  }


  async getInventoryStatus(): Promise<InventoryStatusDTO> {
    const parts = await this.prisma.part.findMany({
      where: { status: { in: ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'] } },
      select: { name: true, stock: true, minStock: true, price: true, status: true },
    });

    let inStock = 0,
      lowStock = 0,
      disStock = 0,
      totalValue = 0;
    const lowStockItems: { name: string; quantity: number; minRequired: number }[] = [];

    for (const p of parts) {
      totalValue += (p.price ?? 0) * p.stock;
      switch (p.status) {
        case 'AVAILABLE':
          inStock++;
          break;
        case 'OUT_OF_STOCK':
          lowStock++;
          lowStockItems.push({ name: p.name, quantity: p.stock, minRequired: p.minStock });
          break;
        case 'DISCONTINUED':
          disStock++;
          break;
      }
    }

    return { inStock, lowStock, disStock, totalItems: parts.length, totalValue, lowStockItems };
  }

 async getBookingsByServiceCenter(): Promise<ServiceCenterStatsDTO[]> {
  const centers = await this.prisma.serviceCenter.findMany({ select: { id: true, name: true } });
  const grouped = await this.prisma.booking.groupBy({
    by: ['centerId'],
    _count: { id: true },
    _sum: { totalCost: true },
  });

  return centers.map((center) => {
    const match = grouped.find((g) => g.centerId === center.id);
    return {
      centerName: center.name,
      bookings: match?._count.id ?? 0,
      revenue: match?._sum.totalCost ?? 0,
    };
  });
}


  async getTrendingPurchases(): Promise<TrendingSummaryDTO> {
  const [services, packages, memberships] = await Promise.all([
    this.getTrendingServices(),
    this.getTrendingPackages(),
    this.getTrendingMemberships(),
  ]);


  const getTopNames = (items: { name: string; value: number }[]) => {
    if (!items.length) return [];
    const topValue = items[0].value;
    return items.filter((i) => i.value === topValue).map((i) => i.name);
  };

  return {
    mostPopularService: getTopNames(services),
    mostPopularPackage: getTopNames(packages),
    mostPopularMembership: getTopNames(memberships),
    services,
    packages,
    memberships,
  }
  }

  private async getTrendingServices() {
    const all = await this.prisma.service.findMany({
      where: { status: 'ACTIVE' },
    });
    const counts = await this.prisma.bookingDetail.groupBy({
      by: ['serviceId'],
      _count: { id: true },
      where: { serviceId: { not: null } },
    });

    return all
      .map((s) => ({ name: s.name, value: counts.find((c) => c.serviceId === s.id)?._count.id ?? 0 }))
      .sort((a, b) => b.value - a.value);
  }

  private async getTrendingPackages() {
    const all = await this.prisma.package.findMany({
      where: { status: 'ACTIVE' },
    });
    const counts = await this.prisma.bookingDetail.groupBy({
      by: ['packageId'],
      _count: { id: true },
      where: { packageId: { not: null } },
    });

    return all
      .map((p) => ({ name: p.name, value: counts.find((c) => c.packageId === p.id)?._count.id ?? 0 }))
      .sort((a, b) => b.value - a.value);
  }

  private async getTrendingMemberships() {
    const all = await this.prisma.membership.findMany({
      where: { status: 'ACTIVE' },
    });
    const counts = await this.prisma.subscription.groupBy({
      by: ['membershipId'],
      _count: { id: true },
    });

    return all
      .map((m) => ({ name: m.name, value: counts.find((c) => c.membershipId === m.id)?._count.id ?? 0 }))
      .sort((a, b) => b.value - a.value);
  }
}

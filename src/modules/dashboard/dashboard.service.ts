import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { DashboardOverviewDTO } from './dto/dashboard-overview.dto';
import { DashboardSummaryDTO } from './dto/dashboard-summary.dto';
import { RevenueByDateDTO } from './dto/revenue-by-date.dto';
import { InventoryStatusDTO } from './dto/inventory-status.dto';
import { ServiceCenterStatsDTO } from './dto/service-center-stats.dto';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toZonedTime, format, fromZonedTime } from 'date-fns-tz';
import { RevenueStatsDTO } from './dto/revenue-stats.dto';
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview(period?: string): Promise<DashboardOverviewDTO> {
    console.log('[Dashboard] getDashboardOverview called with period:', period);

    const [summary, revenueStats, inventoryStatus, serviceCenterStats, trendingPurchases] = await Promise.all([
      this.getSummary(),
      this.getRevenueByDate(period),
      this.getInventoryStatus(),
      this.getBookingsByServiceCenter(),
      this.getTrendingPurchases(),
    ]);

    console.log('[Dashboard] Final summary:', summary);
    return { summary, revenueStats, inventoryStatus, serviceCenterStats, trendingPurchases };
  }

 private async getSummary(): Promise<DashboardSummaryDTO> {
  const timeZone = 'Asia/Ho_Chi_Minh';
  const nowVN = toZonedTime(new Date(), timeZone);


  const startOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - (day - 1));
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
      where: { createdAt: { gte: startThisWeek, lte: endThisWeek } },
    }),
    this.prisma.customer.count({
      where: { createdAt: { gte: startLastWeek, lte: endLastWeek } },
    }),


    this.prisma.employee.count({
      where: { createdAt: { gte: startThisWeek, lte: endThisWeek } },
    }),
    this.prisma.employee.count({
      where: { createdAt: { gte: startLastWeek, lte: endLastWeek } },
    }),


    this.prisma.customer.count(),
    this.prisma.employee.count(),
    this.prisma.serviceCenter.count(),
  ]);

  const totalRevenue = Number(totalRevenueAggregate._sum.amount ?? 0);
  const revenueCurrentWeek = Number(revenueThisWeek._sum.amount ?? 0);
  const revenuePreviousWeek = Number(revenueLastWeek._sum.amount ?? 0);


  const revenueGrowthRate =
    revenuePreviousWeek === 0
      ? (revenueCurrentWeek > 0 ? 100 : 0)
      : ((revenueCurrentWeek - revenuePreviousWeek) / revenuePreviousWeek) * 100;

  const customerGrowthRate =
    customersLastWeek === 0
      ? (customersThisWeek > 0 ? 100 : 0)
      : ((customersThisWeek - customersLastWeek) / customersLastWeek) * 100;

  const employeeGrowthRate =
    employeesLastWeek === 0
      ? (employeesThisWeek > 0 ? 100 : 0)
      : ((employeesThisWeek - employeesLastWeek) / employeesLastWeek) * 100;

  console.log('[Dashboard] Summary by week:', {
    startThisWeek,
    endThisWeek,
    startLastWeek,
    endLastWeek,
    revenueCurrentWeek,
    revenuePreviousWeek,
    revenueGrowthRate,
    customersThisWeek,
    customersLastWeek,
    employeesThisWeek,
    employeesLastWeek,
  });

  return {
    totalRevenue,
    totalCustomers,
    totalEmployees,
    totalServiceCenters: totalCenters,
    revenueGrowthRate,
    customerGrowthRate,
    employeeGrowthRate,
  };
}

  private async getRevenueByDate(period?: string): Promise<RevenueStatsDTO> {
  const timeZone = 'Asia/Ho_Chi_Minh';
  const now = toZonedTime(new Date(), timeZone);
  let start: Date;
  let rangeLabel: string;

  switch (period) {
    case '1d':
      start = subDays(now, 1);
      rangeLabel = '1d';
      break;
    case '3d':
      start = subDays(now, 3);
      rangeLabel = '3d';
      break;
    case '1w':
      start = subDays(now, 7);
      rangeLabel = '1w';
      break;
    case '1m':
      start = subDays(now, 30);
      rangeLabel = '1m';
      break;
    case '3m':
      start = subDays(now, 90);
      rangeLabel = '3m';
      break;
    default:
      start = subDays(now, 90);
      rangeLabel = '3m';
  }

  const transactions = await this.prisma.transaction.findMany({
    where: { status: 'SUCCESS', createdAt: { gte: start, lte: now } },
    select: { createdAt: true, amount: true },
    orderBy: { createdAt: 'asc' },
  });

  const dailyRevenueMap = new Map<string, number>();

  for (const t of transactions) {
    const localDate = format(toZonedTime(t.createdAt, timeZone), 'yyyy-MM-dd');
    dailyRevenueMap.set(localDate, (dailyRevenueMap.get(localDate) || 0) + Number(t.amount));
  }

  const data = Array.from(dailyRevenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalRevenue]) => ({ date, totalRevenue }));

  return { range: rangeLabel, data };
}

  private async getInventoryStatus() {

  const parts = await this.prisma.part.findMany({
    where: { status: { in: ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED'] } },
    select: { id: true, name: true, stock: true, minStock: true, price: true, status: true },
  });

  let instock = 0;
  let lowStock = 0;
  let disStock = 0;
  let totalValue = 0;
  const lowStockItems: { name: string; quantity: number; minRequired: number }[] = [];

  for (const p of parts) {
    totalValue += (p.price ?? 0) * p.stock;

    switch (p.status) {
      case 'AVAILABLE':
        instock += 1;
        break;
      case 'OUT_OF_STOCK':
        lowStock += 1;
        lowStockItems.push({
          name: p.name,
          quantity: p.stock,
          minRequired: p.minStock,
        });
        break;
      case 'DISCONTINUED':
        disStock += 1;
        break;
    }
  }

  return {
    instock,
    lowStock,
    disStock,
    totalItems: parts.length,
    totalValue,
    lowStockItems,
  };
}

  private async getBookingsByServiceCenter(): Promise<ServiceCenterStatsDTO[]> {

  const centers = await this.prisma.serviceCenter.findMany({
    select: { id: true, name: true },
  });


  const bookingsGrouped = await this.prisma.booking.groupBy({
    by: ['centerId'],
    _count: { id: true },
    _sum: { totalCost: true },
  });

  return centers.map((center) => {
    const match = bookingsGrouped.find((g) => g.centerId === center.id);
    return {
      centerName: center.name,
      bookings: match?._count.id ?? 0,
      revenue: match?._sum.totalCost ?? 0,
    };
  });
}

  private async getTrendingPurchases() {

  const allServices = await this.prisma.service.findMany();
  const serviceCounts = await this.prisma.bookingDetail.groupBy({
    by: ['serviceId'],
    _count: { id: true },
    where: { serviceId: { not: null } },
  });

  const services = allServices.map((s) => ({
    name: s.name,
    value: serviceCounts.find((c) => c.serviceId === s.id)?._count.id ?? 0,
  }));

  const mostPopularService = services.sort((a, b) => b.value - a.value)[0]?.name ?? null;


  const allPackages = await this.prisma.package.findMany();
  const packageCounts = await this.prisma.bookingDetail.groupBy({
    by: ['packageId'],
    _count: { id: true },
    where: { packageId: { not: null } },
  });

  const packages = allPackages.map((p) => ({
    name: p.name,
    value: packageCounts.find((c) => c.packageId === p.id)?._count.id ?? 0,
  }));

  const mostPopularPackage = packages.sort((a, b) => b.value - a.value)[0]?.name ?? null;


  const allMemberships = await this.prisma.membership.findMany();
  const membershipCounts = await this.prisma.subscription.groupBy({
    by: ['membershipId'],
    _count: { id: true },
  });

  const memberships = allMemberships.map((m) => ({
    name: m.name,
    value: membershipCounts.find((c) => c.membershipId === m.id)?._count.id ?? 0,
  }));

  const mostPopularMembership = memberships.sort((a, b) => b.value - a.value)[0]?.name ?? null;

  return {
    mostPopularService,
    mostPopularPackage,
    mostPopularMembership,
    services,
    packages,
    memberships,
  };
}
}

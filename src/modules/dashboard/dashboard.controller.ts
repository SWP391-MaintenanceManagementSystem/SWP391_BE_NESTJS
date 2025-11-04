import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardSummaryDTO } from './dto/dashboard-summary.dto';
import { RevenueStatsDTO } from './dto/revenue-stats.dto';
import { InventoryStatusDTO } from './dto/inventory-status.dto';
import { ServiceCenterStatsDTO } from './dto/service-center-stats.dto';
import { TrendingSummaryDTO } from './dto/trending-summary.dto';

@ApiTags('Statistics')
@Controller('api/statistics')
@Roles(AccountRole.ADMIN)
@ApiBearerAuth('jwt-auth')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getSummary(): Promise<DashboardSummaryDTO> {
    return this.dashboardService.getSummary();
  }

  @Get('revenues')
  @ApiQuery({ name: 'range', required: false, example: '1w' })
  async getRevenueByDate(
    @Query('range') range?: '1d' | '3d' | '1w' | '1m' | '3m'
  ): Promise<RevenueStatsDTO> {
    return this.dashboardService.getRevenueByDate(range);
  }

  @Get('inventories')
  async getInventoryStatus(): Promise<InventoryStatusDTO> {
    return this.dashboardService.getInventoryStatus();
  }

  @Get('centers')
  async getServiceCenterStats(): Promise<{ data: ServiceCenterStatsDTO[] }> {
    const centers = await this.dashboardService.getBookingsByServiceCenter();
    return { data: centers };
  }

  @Get('trending')
  async getTrendingPurchases(): Promise<TrendingSummaryDTO> {
    return this.dashboardService.getTrendingPurchases();
  }
}

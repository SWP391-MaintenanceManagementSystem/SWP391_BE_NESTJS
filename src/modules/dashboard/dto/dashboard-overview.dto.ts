import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { DashboardSummaryDTO } from './dashboard-summary.dto';
import { ServiceCenterStatsDTO } from './service-center-stats.dto';
import { InventoryStatusDTO } from './inventory-status.dto';
import { TrendingItemDTO } from './trending-item.dto';
import { RevenueStatsDTO } from './revenue-stats.dto';

export class DashboardOverviewDTO {
  @ApiProperty({ type: DashboardSummaryDTO })
  @Expose()
  @Type(() => DashboardSummaryDTO)
  summary: DashboardSummaryDTO;

  @ApiProperty({ type: RevenueStatsDTO })
  @Expose()
  revenueStats: RevenueStatsDTO;

  @ApiProperty({ type: InventoryStatusDTO })
  @Expose()
  @Type(() => InventoryStatusDTO)
  inventoryStatus: InventoryStatusDTO;

  @ApiProperty({ type: [ServiceCenterStatsDTO] })
  @Expose()
  @Type(() => ServiceCenterStatsDTO)
  serviceCenterStats: ServiceCenterStatsDTO[];

  @ApiProperty()
  @Expose()
  trendingPurchases: {
    mostPopularService: string;
    mostPopularPackage: string;
    mostPopularMembership: string;
    services: TrendingItemDTO[];
    packages: TrendingItemDTO[];
    memberships: TrendingItemDTO[];
  };
}

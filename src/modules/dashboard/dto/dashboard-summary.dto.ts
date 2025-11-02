import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DashboardSummaryDTO {
  @ApiProperty({ example: 125000 })
  @Expose()
  totalRevenue: number;

  @ApiProperty({ example: 480 })
  @Expose()
  totalCustomers: number;

  @ApiProperty({ example: 32 })
  @Expose()
  totalEmployees: number;

  @ApiProperty({ example: 5 })
  @Expose()
  totalServiceCenters: number;

  @ApiProperty({ example: 12.5 })
  @Expose()
  revenueGrowthRate: number;

  @ApiProperty({ example: 8.2 })
  @Expose()
  customerGrowthRate: number;

  @ApiProperty({ example: 2.1 })
  @Expose()
  employeeGrowthRate: number;
}

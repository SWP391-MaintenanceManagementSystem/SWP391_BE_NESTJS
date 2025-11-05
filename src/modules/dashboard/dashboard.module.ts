import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CustomerDashboardService } from './customer-dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, CustomerDashboardService],
})
export class DashboardModule {}

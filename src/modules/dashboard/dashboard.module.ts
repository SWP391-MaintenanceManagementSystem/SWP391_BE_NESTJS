import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CustomerDashboardService } from './customer-dashboard.service';
import { TechnicianDashboardService } from './technician-dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, CustomerDashboardService, TechnicianDashboardService],
  exports: [CustomerDashboardService, TechnicianDashboardService],
})
export class DashboardModule {}

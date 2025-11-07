import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { UploadModule } from '../upload/upload.module';
import { VehicleModule } from '../vehicle/vehicle.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [UploadModule, VehicleModule, DashboardModule],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {}

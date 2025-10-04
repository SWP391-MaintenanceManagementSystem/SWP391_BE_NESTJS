import { Module } from '@nestjs/common';
import { WorkCenterService } from './work-center.service';
import { WorkCenterController } from './work-center.controller';

@Module({
  controllers: [WorkCenterController],
  providers: [WorkCenterService],
  exports: [WorkCenterService],
  imports: [ServiceCenterModule, EmployeeModule, PrismaModule],
})
export class WorkCenterModule {}

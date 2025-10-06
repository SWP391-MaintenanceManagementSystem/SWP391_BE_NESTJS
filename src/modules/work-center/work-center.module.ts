import { Module } from '@nestjs/common';
import { WorkCenterService } from './work-center.service';
import { WorkCenterController } from './work-center.controller';
import { ServiceCenterModule } from '../service-center/service-center.module';
import { EmployeeModule } from '../employee/employee.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [WorkCenterController],
  providers: [WorkCenterService],
  exports: [WorkCenterService],
  imports: [ServiceCenterModule, EmployeeModule, PrismaModule],
})
export class WorkCenterModule {}

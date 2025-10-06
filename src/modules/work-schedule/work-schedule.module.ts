import { Module } from '@nestjs/common';
import { WorkScheduleService } from './work-schedule.service';
import { WorkScheduleController } from './work-schedule.controller';
import { ShiftModule } from '../shift/shift.module';
import { EmployeeModule } from '../employee/employee.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [WorkScheduleController],
  providers: [WorkScheduleService],
  exports: [WorkScheduleService],
  imports: [ShiftModule, EmployeeModule, PrismaModule],
})
export class WorkScheduleModule {}

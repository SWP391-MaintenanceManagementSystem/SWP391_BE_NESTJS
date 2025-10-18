import { Module } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { TechnicianController } from './technician.controller';
import { AccountModule } from 'src/modules/account/account.module';
import { EmployeeModule } from '../employee.module';
import { EmployeeService } from '../employee.service';

@Module({
  imports: [AccountModule, EmployeeModule],
  controllers: [TechnicianController],
  providers: [TechnicianService, EmployeeService],
  exports: [TechnicianService],
})
export class TechnicianModule {}

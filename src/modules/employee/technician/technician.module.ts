import { Module } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { TechnicianController } from './technician.controller';
import { AccountModule } from 'src/modules/account/account.module';
import { EmployeeModule } from '../employee.module';

@Module({
  imports: [AccountModule, EmployeeModule],
  controllers: [TechnicianController],
  providers: [TechnicianService],
  exports: [TechnicianService],
})
export class TechnicianModule {}

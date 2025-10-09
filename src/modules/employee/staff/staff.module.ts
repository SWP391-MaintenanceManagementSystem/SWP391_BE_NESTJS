import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { AccountModule } from 'src/modules/account/account.module';
import { EmployeeModule } from '../employee.module';

@Module({
  imports: [AccountModule, EmployeeModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}

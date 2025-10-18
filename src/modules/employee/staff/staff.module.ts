import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { AccountModule } from 'src/modules/account/account.module';
import { EmployeeModule } from '../employee.module';
import { CertificateModule } from '../certificate/certificate.module';

@Module({
  imports: [AccountModule, EmployeeModule, CertificateModule],
  controllers: [StaffController],
  providers: [StaffService, EmployeeModule],
  exports: [StaffService],
})
export class StaffModule {}

import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { AccountModule } from 'src/modules/account/account.module';
import { EmployeeModule } from '../employee.module';
import { CertificateModule } from '../certificate/certificate.module';
import { NotificationModule } from 'src/modules/notification/notification.module';

@Module({
  imports: [AccountModule, EmployeeModule, CertificateModule, NotificationModule],
  controllers: [StaffController],
  providers: [StaffService, EmployeeModule],
  exports: [StaffService],
})
export class StaffModule {}

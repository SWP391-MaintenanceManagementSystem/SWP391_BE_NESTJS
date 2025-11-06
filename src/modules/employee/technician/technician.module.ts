import { Module } from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { TechnicianController } from './technician.controller';
import { AccountModule } from 'src/modules/account/account.module';
import { EmployeeModule } from '../employee.module';
import { EmployeeService } from '../employee.service';
import { BookingAssignmentModule } from 'src/modules/booking-assignment/booking-assignment.module';
import { BookingModule } from 'src/modules/booking/booking.module';
import { NotificationModule } from 'src/modules/notification/notification.module';

@Module({
  imports: [
    AccountModule,
    EmployeeModule,
    BookingAssignmentModule,
    BookingModule,
    NotificationModule,
  ],
  controllers: [TechnicianController],
  providers: [TechnicianService, EmployeeService],
  exports: [TechnicianService],
})
export class TechnicianModule {}

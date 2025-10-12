import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingDetailModule } from '../booking-detail/booking-detail.module';
import { CustomerBookingService } from './customer-booking.service';
import { AdminBookingService } from './admin-booking.service';
import { StaffBookingService } from './staff-booking.service';

@Module({
  imports: [BookingDetailModule],
  controllers: [BookingController],
  providers: [BookingService, CustomerBookingService, AdminBookingService, StaffBookingService],
})
export class BookingModule {}

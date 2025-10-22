import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingDetailModule } from '../booking-detail/booking-detail.module';
import { CustomerBookingService } from './customer-booking.service';
import { AdminBookingService } from './admin-booking.service';
import { StaffBookingService } from './staff-booking.service';
import { TechnicianBookingService } from './technician-booking.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [BookingDetailModule, PrismaModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    CustomerBookingService,
    AdminBookingService,
    StaffBookingService,
    TechnicianBookingService,
  ],
  exports: [BookingService, TechnicianBookingService, StaffBookingService],
})
export class BookingModule {}

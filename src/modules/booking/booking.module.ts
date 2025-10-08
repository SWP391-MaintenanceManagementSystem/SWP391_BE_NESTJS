import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { BookingDetailModule } from '../booking-detail/booking-detail.module';

@Module({
  imports: [BookingDetailModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}

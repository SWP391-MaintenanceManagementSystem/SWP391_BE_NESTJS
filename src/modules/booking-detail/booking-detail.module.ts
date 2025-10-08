import { Module } from '@nestjs/common';
import { BookingDetailService } from './booking-detail.service';
import { BookingDetailController } from './booking-detail.controller';

@Module({
  controllers: [BookingDetailController],
  providers: [BookingDetailService],
  exports: [BookingDetailService],
})
export class BookingDetailModule {}

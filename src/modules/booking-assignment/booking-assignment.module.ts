import { Module } from '@nestjs/common';
import { BookingAssignmentService } from './booking-assignment.service';
import { BookingAssignmentController } from './booking-assignment.controller';

@Module({
  controllers: [BookingAssignmentController],
  providers: [BookingAssignmentService],
  exports: [BookingAssignmentService],
})
export class BookingAssignmentModule {}

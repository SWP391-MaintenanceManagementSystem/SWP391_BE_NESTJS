import { Controller } from '@nestjs/common';
import { BookingDetailService } from './booking-detail.service';

@Controller('booking-detail')
export class BookingDetailController {
  constructor(private readonly bookingDetailService: BookingDetailService) {}
}

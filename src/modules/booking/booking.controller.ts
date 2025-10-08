import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDTO } from './dto/create-booking.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingQueryDTO } from './dto/booking-query.dto';

@Controller('api/bookings')
@ApiTags('Bookings')
@ApiBearerAuth('jwt-auth')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('/')
  async getBookings(@Query() query: BookingQueryDTO): Promise<any> {
    return {
      message: 'Get bookings endpoint',
    };
  }

  @Get('/:id')
  async getBookingById(@Param('id') id: string): Promise<any> {
    return this.bookingService.getBookingById(id);
  }

  @Post('/')
  async createBooking(@Body() bookingData: CreateBookingDTO): Promise<any> {
    return this.bookingService.createBooking(bookingData);
  }
}

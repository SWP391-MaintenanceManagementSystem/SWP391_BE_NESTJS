import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDTO } from './dto/create-booking.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingQueryDTO } from './dto/booking-query.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';
import { BookingDTO } from './dto/booking.dto';

@Controller('api/bookings')
@ApiTags('Bookings')
@ApiBearerAuth('jwt-auth')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('/')
  async getBookings(@Query() query: BookingQueryDTO) {
    const { data, page, pageSize, total, totalPages } =
      await this.bookingService.getBookings(query);
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
      message: 'Get bookings successfully',
    };
  }

  @Get('/:id')
  async getBookingById(@Param('id') id: string) {
    const data = await this.bookingService.getBookingById(id);
    return {
      data,
      message: 'Get booking successfully',
    };
  }

  @Post('/')
  async createBooking(@Body() bookingData: CreateBookingDTO, @CurrentUser() user: JWT_Payload) {
    const data = await this.bookingService.createBooking(bookingData, user.sub);
    return {
      data,
      message: 'Booking created successfully',
    };
  }
}

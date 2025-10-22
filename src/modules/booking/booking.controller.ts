import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDTO } from './dto/create-booking.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingQueryDTO } from './dto/booking-query.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';
import { CustomerUpdateBookingDTO } from './dto/customer-update-booking.dto';
import { StaffUpdateBookingDTO } from './dto/staff-update-booking.dto';
import { AdminUpdateBookingDTO } from './dto/admin-update-booking.dto';
import { Roles } from 'src/common/decorator/role.decorator';
import { AccountRole } from '@prisma/client';
import { TechnicianBookingService } from './technician-booking.service';

@Controller('api/bookings')
@ApiTags('Bookings')
@ApiBearerAuth('jwt-auth')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly technicianBookingService: TechnicianBookingService
  ) {}

  @Get('/')
  async getBookings(@Query() query: BookingQueryDTO, @CurrentUser() user: JWT_Payload) {
    const { data, page, pageSize, total, totalPages } = await this.bookingService.getBookings(
      query,
      user
    );
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
  async getBookingById(@Param('id') id: string, @CurrentUser() user: JWT_Payload) {
    const data = await this.bookingService.getBookingById(id, user);
    return {
      data,
      message: 'Get booking successfully',
    };
  }

  @Post('/')
  async createBooking(@Body() bookingData: CreateBookingDTO, @CurrentUser() user: JWT_Payload) {
    const { booking, warning } = await this.bookingService.createBooking(bookingData, user.sub);
    return {
      data: booking,
      warning,
      message: 'Booking created successfully',
    };
  }

  @Patch('admin/:id')
  @Roles(AccountRole.ADMIN)
  async adminUpdateBooking(
    @Param('id') id: string,
    @Body() body: AdminUpdateBookingDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const data = await this.bookingService.updateBooking(id, body, user);
    return {
      data,
      message: 'Booking updated successfully',
    };
  }

  @Patch('customer/:id')
  @Roles(AccountRole.CUSTOMER)
  async customerUpdateBooking(
    @Param('id') id: string,
    @Body() body: CustomerUpdateBookingDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const data = await this.bookingService.updateBooking(id, body, user);
    return {
      data,
      message: 'Booking updated successfully',
    };
  }

  @Patch('staff/:id')
  @Roles(AccountRole.STAFF)
  async staffUpdateBooking(
    @Param('id') id: string,
    @Body() body: StaffUpdateBookingDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const data = await this.bookingService.updateBooking(id, body, user);
    return {
      data,
      message: 'Booking updated successfully',
    };
  }

  @Delete(':id')
  async cancelBooking(@Param('id') id: string, @CurrentUser() user: JWT_Payload) {
    const data = await this.bookingService.cancelBooking(id, user);
    return {
      data,
      message: 'Booking cancelled successfully',
    };
  }
}

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
import { BookingHistoryQueryDTO } from './dto/booking-history-query.dto';
import { CustomerBookingService } from './customer-booking.service';
import { CreateFeedbackDTO } from './dto/create-feedback.dto';
import { EmitNotification } from 'src/common/decorator/emit-notification.decorator';
import { NotificationTemplateService } from 'src/modules/notification/notification-template.service';

@Controller('api/bookings')
@ApiTags('Bookings')
@ApiBearerAuth('jwt-auth')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly customerBookingService: CustomerBookingService
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

  @Get('/history')
  async getCustomerBookingHistory(
    @CurrentUser() user: JWT_Payload,
    @Query() query: BookingHistoryQueryDTO
  ) {
    const { data, page, pageSize, total, totalPages } =
      await this.bookingService.getCustomerBookingHistory(user, query);
    return {
      data,
      page,
      pageSize,
      total,
      totalPages,
      message: 'Get booking history successfully',
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
  @EmitNotification(NotificationTemplateService.bookingCreatedWithStaff())
  async createBooking(@Body() bookingData: CreateBookingDTO, @CurrentUser() user: JWT_Payload) {
    const { booking, warning, staffIds } = await this.bookingService.createBooking(
      bookingData,
      user.sub
    );
    return {
      data: booking,
      customerId: user.sub,
      staffIds,
      warning,
      message: 'Booking created successfully',
    };
  }

  @Patch('admin/:id')
  @Roles(AccountRole.ADMIN)
  @EmitNotification(NotificationTemplateService.bookingStatusUpdate())
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
  @EmitNotification(NotificationTemplateService.bookingStatusUpdate())
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
  @EmitNotification(NotificationTemplateService.bookingStatusUpdate())
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
  @EmitNotification(NotificationTemplateService.bookingCancelled())
  async cancelBooking(@Param('id') id: string, @CurrentUser() user: JWT_Payload) {
    const { booking, customerId, staffIds, cancelledBy, cancellerInfo } =
      await this.bookingService.cancelBooking(id, user);

    return {
      data: booking,
      customerId,
      staffIds,
      cancelledBy,
      cancellerInfo,
      message: 'Booking cancelled successfully',
    };
  }

  @Post('/feedback')
  @Roles(AccountRole.CUSTOMER)
  async feedbackBooking(@Body() body: CreateFeedbackDTO, @CurrentUser() user: JWT_Payload) {
    const data = await this.customerBookingService.feedbackBooking(body, user.sub);
    return {
      data,
      message: 'Booking feedback submitted successfully',
    };
  }
}

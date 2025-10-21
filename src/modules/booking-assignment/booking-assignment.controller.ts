import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BookingAssignmentService } from './booking-assignment.service';
import { CreateBookingAssignmentsDTO } from './dto/create-booking-assignments.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('api/booking-assignments')
@ApiTags('Booking Assignments')
@ApiBearerAuth('jwt-auth')
export class BookingAssignmentController {
  constructor(private readonly bookingAssignmentService: BookingAssignmentService) {}

  @Post('/')
  async assignTechnicians(
    @Body() body: CreateBookingAssignmentsDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const data = await this.bookingAssignmentService.assignTechniciansToBooking(body, user.sub);
    return {
      data,
      message: 'Technicians assigned successfully',
    };
  }

  @Get('/:bookingId')
  async getAssignmentsForBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: JWT_Payload
  ) {
    switch (user.role) {
      case 'CUSTOMER':
        const customerAssignments = await this.bookingAssignmentService.getAssignmentsForCustomer(
          bookingId,
          user.sub
        );
        return {
          data: customerAssignments,
          message: 'Assignments retrieved successfully',
        };
      case 'STAFF':
        const staffAssignments = await this.bookingAssignmentService.getAssignmentsForStaff(
          bookingId,
          user
        );
        return {
          data: staffAssignments,
          message: 'Assignments retrieved successfully',
        };
      default:
        const data = await this.bookingAssignmentService.getBookingAssignments(bookingId);
        return {
          data,
          message: 'Assignments retrieved successfully',
        };
    }
  }

  @Delete('/:assignmentId')
  async removeAssignmentsForBooking(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: JWT_Payload
  ) {
    const { message } = await this.bookingAssignmentService.deleteAssignment(assignmentId, user);
    return {
      message,
    };
  }
}

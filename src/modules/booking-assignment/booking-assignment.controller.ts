import { Body, Controller, Post } from '@nestjs/common';
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
}

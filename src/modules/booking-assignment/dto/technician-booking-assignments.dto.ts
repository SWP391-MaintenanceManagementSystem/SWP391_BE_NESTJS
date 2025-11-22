import { BookingDTO } from 'src/modules/booking/dto/booking.dto';
import { EmployeeInfoDTO } from './employee-info.dto';
import { Expose, Type } from 'class-transformer';

export class TechnicianBookingAssignmentDTO {
  @Expose()
  @Type(() => BookingDTO)
  booking: BookingDTO;

  @Expose()
  @Type(() => EmployeeInfoDTO)
  assigner: EmployeeInfoDTO;

  @Expose()
  createdAt: Date;
}

import { EmployeeDTO } from 'src/modules/employee/dto/employee.dto';
import { EmployeeInfoDTO } from './employee-info.dto';
import { Expose, Type } from 'class-transformer';
import { BookingDTO } from 'src/modules/booking/dto/booking.dto';

export class StaffBookingAssignmentDTO {
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

  @Expose()
  @Type(() => BookingDTO)
  booking: BookingDTO;

  @Expose()
  @Type(() => EmployeeInfoDTO)
  employee: EmployeeInfoDTO;

  @Expose()
  @Type(() => EmployeeDTO)
  assigner: EmployeeDTO;
}

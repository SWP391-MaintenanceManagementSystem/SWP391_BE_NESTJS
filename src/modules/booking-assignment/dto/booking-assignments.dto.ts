import { Expose, Type } from 'class-transformer';
import { BookingDTO } from 'src/modules/booking/dto/booking.dto';
import { EmployeeInfoDTO } from './employee-info.dto';

export class BookingAssignmentsDTO {
  @Expose() id: string;

  @Expose()
  @Type(() => BookingDTO)
  booking: BookingDTO;

  @Expose()
  @Type(() => EmployeeInfoDTO)
  employee: EmployeeInfoDTO;

  @Expose()
  @Type(() => EmployeeInfoDTO)
  assigner: EmployeeInfoDTO;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}

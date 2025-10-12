import { Expose } from 'class-transformer';

export class BookingAssignmentsDTO {
  @Expose()
  id: string;
  @Expose()
  bookingId: string;
  @Expose()
  employeeId: string;
  @Expose()
  assignedBy: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}

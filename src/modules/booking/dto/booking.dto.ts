import { Expose, Transform } from 'class-transformer';
import { utcToVNDate } from 'src/utils';

export class BookingDTO {
  @Expose()
  id: string;
  @Expose()
  customerId: string;
  @Expose()
  vehicleId: string;
  @Expose()
  centerId: string;
  @Expose()
  shiftId: string;
  @Expose()
  totalCost: number;
  @Expose()
  @Transform(({ obj }) => utcToVNDate(obj.bookingDate))
  bookingDate: Date;
  @Expose()
  status: string;
  @Expose()
  note?: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}

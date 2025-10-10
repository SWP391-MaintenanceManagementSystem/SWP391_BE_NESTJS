import { Expose } from 'class-transformer';

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

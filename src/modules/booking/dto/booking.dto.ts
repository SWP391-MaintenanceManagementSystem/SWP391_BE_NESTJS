import { Exclude } from 'class-transformer';

export class BookingDTO {
  @Exclude()
  id: string;
  @Exclude()
  customerId: string;
  @Exclude()
  vehicleId: string;
  @Exclude()
  centerId: string;
  @Exclude()
  shiftId: string;
  @Exclude()
  totalCost: number;
  @Exclude()
  bookingDate: Date;
  @Exclude()
  status: string;
  @Exclude()
  note?: string;
  @Exclude()
  createdAt: Date;
  @Exclude()
  updatedAt: Date;
}

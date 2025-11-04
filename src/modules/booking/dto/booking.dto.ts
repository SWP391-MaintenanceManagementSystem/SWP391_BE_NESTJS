import { Expose, Transform } from 'class-transformer';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns/format';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';
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
  @Transform(({ obj }) => {
    const localDate = toZonedTime(obj.bookingDate, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  bookingDate: string;

  @Expose()
  feedback?: string;

  @Expose()
  rating?: number;

  @Expose()
  status: string;
  @Expose()
  note?: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}

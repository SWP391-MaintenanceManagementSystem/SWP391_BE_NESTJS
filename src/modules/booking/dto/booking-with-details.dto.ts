import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { BookingDetailDTO } from 'src/modules/booking-detail/dto/booking-detail.dto';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns/format';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';
class BookingVehicleDTO {
  @Expose()
  id: string;
  @Expose()
  vin: string;
  @Expose()
  licensePlate: string;
  @Expose()
  model: string;
  @Expose()
  brand: string;
}

class BookingCenterDTO {
  @Expose()
  id: string;
  @Expose()
  name: string;
}

export class BookingWithDetailsDTO {
  @Expose()
  id: string;
  @Exclude()
  customerId: string;
  @Exclude()
  vehicleId: string;
  @Exclude()
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
  status: string;
  @Expose()
  note?: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => BookingDetailDTO)
  bookingDetails: BookingDetailDTO[];

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => AccountWithProfileDTO)
  account: AccountWithProfileDTO;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => BookingVehicleDTO)
  vehicle: BookingVehicleDTO;

  @Expose()
  @ValidateNested({ each: true })
  @Type(() => BookingCenterDTO)
  serviceCenter: BookingCenterDTO;
}

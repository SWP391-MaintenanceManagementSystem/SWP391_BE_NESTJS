import { Expose, Transform, Type } from 'class-transformer';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns/format';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';

class VehicleInfo {
  @Expose()
  id: string;
  @Expose()
  licensePlate: string;
  @Expose()
  model: string;
  @Expose()
  brand: string;
  @Expose()
  productionYear: number;
}

class CenterInfo {
  @Expose()
  id: string;
  @Expose()
  name: string;
}

export class BookingDTO {
  @Expose()
  id: string;
  @Expose()
  customerId: string;
  @Expose()
  @Transform(({ obj }) => ({
    id: obj.vehicle?.id,
    licensePlate: obj.vehicle?.licensePlate,
    vin: obj.vehicle?.vin,
    model: obj.vehicle?.vehicleModel?.name,
    brand: obj.vehicle?.vehicleModel?.brand?.name,
    productionYear: obj.vehicle?.vehicleModel?.productionYear,
  }))
  @Type(() => VehicleInfo)
  vehicle: VehicleInfo;

  @Expose()
  @Transform(({ obj }) => ({
    id: obj.serviceCenter?.id,
    name: obj.serviceCenter?.name,
  }))
  @Type(() => CenterInfo)
  center: CenterInfo;

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

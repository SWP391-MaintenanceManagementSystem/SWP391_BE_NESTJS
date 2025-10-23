import { Expose, Transform, Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';
import { utcToVNDate } from 'src/utils';

class CustomerInfo {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  isPremium: boolean;
}

class VehicleInfo {
  @Expose()
  id: string;
  @Expose()
  licensePlate: string;
  @Expose()
  vin: string;
  @Expose()
  model: string;
  @Expose()
  brand: string;
  @Expose()
  productionYear?: number;
}

class ServiceCenterInfo {
  @Expose()
  name: string;

  @Expose()
  address: string;
}

class ShiftInfo {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ obj }) => utcToVNDate(obj.startTime))
  startTime: Date;

  @Expose()
  @Transform(({ obj }) => utcToVNDate(obj.endTime))
  endTime: Date;
}

class AssignerInfo {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;
}

export class TechnicianBookingDTO {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ obj }) => utcToVNDate(obj.bookingDate))
  bookingDate: Date;

  @Expose()
  status: BookingStatus;

  @Expose()
  totalCost: number;

  @Expose()
  note?: string;

  @Expose()
  @Transform(({ obj }) => ({
    firstName: obj.customer?.firstName,
    lastName: obj.customer?.lastName,
    email: obj.customer?.account?.email,
    phone: obj.customer?.account?.phone,
    isPremium: obj.customer?.isPremium,
  }))
  @Type(() => CustomerInfo)
  customer: CustomerInfo;

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
  @Type(() => ServiceCenterInfo)
  serviceCenter: ServiceCenterInfo;

  @Expose()
  @Type(() => ShiftInfo)
  shift: ShiftInfo;

  @Expose()
  @Type(() => AssignerInfo)
  assigner: AssignerInfo;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

import { Expose, Transform, Type } from 'class-transformer';

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

class CustomerInfo {
  @Expose()
  id: string;

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

export class StaffBookingDTO {
  @Expose()
  id: string;
  @Expose()
  @Transform(({ obj }) => ({
    id: obj.customer?.accountId,
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
  centerId: string;
  @Expose()
  shiftId: string;
  @Expose()
  totalCost: number;
  @Expose()
  @Transform(({ obj }) => obj.bookingDate.toISOString())
  bookingDate: string;
  @Expose()
  status: string;
  @Expose()
  note?: string;
  @Expose()
  createdAt: Date;
  @Expose()
  updatedAt: Date;
}

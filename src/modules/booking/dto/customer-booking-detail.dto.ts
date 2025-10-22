import { Expose, Transform, Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';
class CustomerInfo {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;
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
  startTime: Date;

  @Expose()
  endTime: Date;
}

class TechnicianInfo {
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
}
class AssignerInfo {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;
}

export class CustomerBookingDetailDTO {
  @Expose()
  id: string;

  @Expose()
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
  @Transform(({ obj }) => ({
    firstName: obj.bookingAssignments?.[0]?.assigner?.firstName,
    lastName: obj.bookingAssignments?.[0]?.assigner?.lastName,
    email: obj.bookingAssignments?.[0]?.assigner?.account?.email,
  }))
  @Type(() => AssignerInfo)
  staff: AssignerInfo;
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.bookingAssignments?.map((ba: any) => ({
        firstName: ba.employee?.firstName,
        lastName: ba.employee?.lastName,
      })) || []
  )
  @Type(() => TechnicianInfo)
  technicians: TechnicianInfo[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

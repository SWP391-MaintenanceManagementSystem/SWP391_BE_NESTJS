import { Expose, Transform, Type } from 'class-transformer';
import { CustomerBookingDetailDTO } from './customer-booking-detail.dto';

class ServiceCenterInfo {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;
}

class TechnicianInfo {
  @Expose()
  id: string;
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
}

export class StaffBookingDetailDTO extends CustomerBookingDetailDTO {
  @Expose()
  @Type(() => ServiceCenterInfo)
  serviceCenter: ServiceCenterInfo;
  @Expose()
  @Transform(
    ({ obj }) =>
      obj.bookingAssignments?.map((ba: any) => ({
        id: ba.employee?.account.id,
        firstName: ba.employee?.firstName,
        lastName: ba.employee?.lastName,
      })) || []
  )
  @Type(() => TechnicianInfo)
  technicians: TechnicianInfo[];
}

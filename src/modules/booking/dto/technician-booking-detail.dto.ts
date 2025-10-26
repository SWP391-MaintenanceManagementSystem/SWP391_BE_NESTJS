import { BookingDetailStatus } from '@prisma/client';
import { CustomerBookingDetailDTO } from './customer-booking-detail.dto';
import { Expose, Transform, Type } from 'class-transformer';

class ServiceInfo {
  @Expose()
  id: string;
  @Expose()
  bookingDetailId: string;
  @Expose()
  name: string;
  @Expose()
  price: number;
  @Expose()
  status: BookingDetailStatus;
}

class PackageInfo {
  @Expose()
  id: string;
  @Expose()
  bookingDetailId: string;
  @Expose()
  name: string;
  @Expose()
  price: number;
  @Expose()
  services: Omit<ServiceInfo, 'bookingDetailId'>[];
  @Expose()
  status: BookingDetailStatus;
}

class BookingDetails {
  @Expose()
  @Type(() => ServiceInfo)
  services?: ServiceInfo[];
  @Expose()
  @Type(() => PackageInfo)
  packages?: PackageInfo[];
}

export class TechnicianBookingDetailDTO extends CustomerBookingDetailDTO {
  @Expose()
  @Transform(({ obj }) => {
    const services: ServiceInfo[] = [];
    const packages: PackageInfo[] = [];

    obj.bookingDetails.forEach((detail: any) => {
      if (detail.service) {
        services.push({
          id: detail.service.id,
          bookingDetailId: detail.id,
          name: detail.service.name,
          price: detail.service.price,
          status: detail.status,
        });
      }
      if (detail.package) {
        packages.push({
          id: detail.package.id,
          bookingDetailId: detail.id,
          services: detail.package.packageDetails.map((pd: any) => ({
            id: pd.service.id,
            name: pd.service.name,
            price: pd.service.price,
          })),
          name: detail.package.name,
          price: detail.package.price,
          status: detail.status,
        });
      }
    });

    return { services, packages };
  })
  bookingDetails: BookingDetails;
}

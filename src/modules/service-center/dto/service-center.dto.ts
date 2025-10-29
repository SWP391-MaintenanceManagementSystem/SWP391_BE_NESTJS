import { Expose, Transform, Type } from 'class-transformer';
import { ServiceCenterEmployeeDTO } from './service-center-employee.dto';
import { plainToInstance } from 'class-transformer';

export class ServiceCenterDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  status: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.workCenters) return undefined;
    const now = new Date();
    return (
      obj.workCenters?.filter(
        (wc: { endDate?: string | Date }) => !wc.endDate || new Date(wc.endDate) > now
      ) || []
    ).map((wc: any) =>
      plainToInstance(ServiceCenterEmployeeDTO, wc, { excludeExtraneousValues: true })
    );
  })
  employees?: ServiceCenterEmployeeDTO[];

  @Expose()
  @Transform(({ obj }) => {
    if (!obj._count) return undefined;
    return {
      totalEmployees: obj._count?.workCenters || 0,
      activeEmployees:
        obj.workCenters?.filter(
          (wc: { endDate?: string | Date }) => !wc.endDate || new Date(wc.endDate) > new Date()
        ).length || 0,
      totalShifts: obj._count?.shifts || 0,
      totalBookings: obj._count?.bookings || 0,
    };
  })
  statistics?: {
    totalEmployees: number;
    activeEmployees: number;
    totalShifts: number;
    totalBookings: number;
  };
}

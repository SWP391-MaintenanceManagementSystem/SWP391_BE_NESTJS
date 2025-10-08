import { Expose, Transform, Type } from 'class-transformer';
import { ServiceCenterEmployeeDto } from './service-center-employee.dto';

export class ServiceCenterDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  status: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString(), { toPlainOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString(), { toPlainOnly: true })
  updatedAt: Date;

  // Optional fields for detailed view
  @Expose()
  @Type(() => ServiceCenterEmployeeDto)
  @Transform(({ obj }) => {
    if (!obj.workCenters) return undefined;
    // Filter active employees only (endDate is null or in future)
    const now = new Date();
    return (
      obj.workCenters?.filter(
        (wc: { endDate?: string | Date }) => !wc.endDate || new Date(wc.endDate) > now
      ) || []
    );
  })
  employees?: ServiceCenterEmployeeDto[];

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

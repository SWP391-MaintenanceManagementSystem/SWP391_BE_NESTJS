import { Expose, Transform } from 'class-transformer';
import { $Enums } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns/format';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';

export class WorkCenterDTO {
  @Expose()
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  centerId: string;

  @Expose()
  @Transform(({ obj }) => {
    const localDate = toZonedTime(obj.startDate, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  startDate: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.endDate) return null;
    const localDate = toZonedTime(obj.endDate, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  endDate: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    const employee = obj.employee;
    const account = employee?.account;

    if (!account) return null;

    return {
      id: account.id,
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      avatar: account.avatar,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      profile: employee
        ? {
            firstName: employee.firstName,
            lastName: employee.lastName,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt,
          }
        : null,
    };
  })
  account: {
    id: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
    profile: {
      firstName: string;
      lastName: string;
      createdAt: string;
      updatedAt: string;
    } | null;
  };

  @Expose()
  @Transform(({ obj }) => {
    const serviceCenter = obj.serviceCenter;
    if (!serviceCenter) return undefined;

    return {
      id: serviceCenter.id,
      name: serviceCenter.name,
      address: serviceCenter.address,
      status: serviceCenter.status,
    };
  })
  serviceCenter?: {
    id: string;
    name: string;
    address: string;
    status: $Enums.CenterStatus;
  };
}

import { Expose, Transform } from 'class-transformer';
import { $Enums } from '@prisma/client';

export class WorkCenterDto {
  @Expose()
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  centerId: string;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), { toPlainOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), { toPlainOnly: true })
  updatedAt: Date;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), { toPlainOnly: true })
  startDate: Date;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), { toPlainOnly: true })
  endDate: Date | null;

  @Expose()
  @Transform(({ obj }) => {
    const employee = obj.employee;
    const account = employee?.account;

    if (!account) return null;

    return {
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      avatar: account.avatar,
      createdAt: account.createdAt?.toISOString(),
      updatedAt: account.updatedAt?.toISOString(),
      profile: employee
        ? {
            firstName: employee.firstName,
            lastName: employee.lastName,
            createdAt: employee.createdAt?.toISOString(),
            updatedAt: employee.updatedAt?.toISOString(),
          }
        : null,
    };
  })
  account: {
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

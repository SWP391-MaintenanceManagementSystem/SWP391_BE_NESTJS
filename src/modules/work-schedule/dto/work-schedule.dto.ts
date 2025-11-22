import { Expose, Transform } from 'class-transformer';

export class WorkScheduleDTO {
  @Expose()
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  shiftId: string;

  @Expose()
  date: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    const employee = obj.employee;
    const account = employee?.account;

    if (!employee || !account) return undefined;

    return {
      id: account.id,
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      avatar: account.avatar,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      profile: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
    };
  })
  account?: {
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
    };
  };

  @Expose()
  @Transform(({ obj }) => {
    const shift = obj.shift;
    const serviceCenter = shift?.serviceCenter;

    if (!shift) return undefined;

    return {
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      maximumSlot: shift.maximumSlot,
      status: shift.status,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt,
      serviceCenter: serviceCenter
        ? {
            id: serviceCenter.id,
            name: serviceCenter.name,
            address: serviceCenter.address,
            status: serviceCenter.status,
            createdAt: serviceCenter.createdAt,
            updatedAt: serviceCenter.updatedAt,
          }
        : undefined,
    };
  })
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    maximumSlot: number | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    serviceCenter?: {
      id: string;
      name: string;
      address: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

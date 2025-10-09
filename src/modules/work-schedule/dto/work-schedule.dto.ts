import { $Enums } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export class WorkScheduleDTO {
  @Expose()
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  shiftId: string;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString().split('T')[0] : null), {
    toPlainOnly: true,
  })
  date: Date;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), { toPlainOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value ? value.toISOString() : null), { toPlainOnly: true })
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    const employee = obj.employee;
    const account = employee?.account;

    if (!employee || !account) return undefined;

    return {
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      avatar: account.avatar,
      createdAt: account.createdAt?.toISOString(),
      updatedAt: account.updatedAt?.toISOString(),
      profile: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        createdAt: employee.createdAt?.toISOString(),
        updatedAt: employee.updatedAt?.toISOString(),
      },
    };
  })
  account?: {
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
    if (!shift) return undefined;

    return {
      id: shift.id,
      name: shift.name,
      startTime: shift.startTime?.toISOString(),
      endTime: shift.endTime?.toISOString(),
      startDate: shift.startDate?.toISOString(),
      endDate: shift.endDate?.toISOString(),
      maximumSlot: shift.maximumSlot,
      repeatDays: shift.repeatDays,
      status: shift.status,
      serviceCenter: shift.serviceCenter
        ? {
            id: shift.serviceCenter.id,
            name: shift.serviceCenter.name,
            address: shift.serviceCenter.address,
            status: shift.serviceCenter.status,
          }
        : undefined,
    };
  })
  shift?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    startDate: string | null;
    endDate: string | null;
    maximumSlot: number | null;
    repeatDays: number[];
    status: $Enums.ShiftStatus;
    serviceCenter?: {
      id: string;
      name: string;
      address: string;
      status: $Enums.CenterStatus;
    };
  };
}

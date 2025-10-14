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
    const serviceCenter = shift?.serviceCenter;

    if (!shift) return undefined;

    return {
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      maximumSlot: shift.maximumSlot,
      status: shift.status,
      createdAt: shift.createdAt?.toISOString(),
      updatedAt: shift.updatedAt?.toISOString(),
    };
  })
  shift?: {
    name: string;
    startTime: string;
    endTime: string;
    maximumSlot: number | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

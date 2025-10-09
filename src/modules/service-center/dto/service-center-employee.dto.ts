import { Expose, Transform } from 'class-transformer';

export class ServiceCenterEmployeeDTO {
  @Expose()
  id: string;

  @Expose()
  employeeId: string;

  @Expose()
  @Transform(({ value }) => value?.toISOString(), { toPlainOnly: true })
  startDate: Date;

  @Expose()
  @Transform(({ value }) => value?.toISOString(), { toPlainOnly: true })
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
}

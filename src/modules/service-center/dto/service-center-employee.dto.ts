import { Expose, Transform } from 'class-transformer';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';

export class ServiceCenterEmployeeDTO {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    const localDate = toZonedTime(value, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  startDate: string;

  @Expose()
  @Transform(({ value }) => {
    if (!value) return null;
    const localDate = toZonedTime(value, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  endDate?: string | null;

  @Expose()
  @Transform(({ obj }) => {
    const account = obj.employee?.account;
    if (!account) return null;
    return {
      email: account.email,
      phone: account.phone,
      role: account.role,
      status: account.status,
      avatar: account.avatar,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      profile: {
        firstName: obj.employee?.firstName,
        lastName: obj.employee?.lastName,
        createdAt: obj.employee?.createdAt,
        updatedAt: obj.employee?.updatedAt,
      },
    };
  })
  account: {
    email: string;
    phone: string;
    role: string;
    status: string;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
    profile: {
      firstName: string;
      lastName: string;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  };
}

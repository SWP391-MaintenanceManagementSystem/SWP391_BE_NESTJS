import { Expose, Transform } from 'class-transformer';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';

export class VehicleHandoverDTO {
  @Expose()
  id: string;

  @Expose()
  bookingId: string;

  @Expose()
  staffId: string;

  @Expose()
  odometer: number;

  @Expose()
  note?: string;

  @Expose()
  description?: string[];

  @Expose()
  @Transform(({ obj }) => {
    const vnTime = toZonedTime(obj.date, VN_TIMEZONE);
    return format(vnTime, VN_DATE_TIME_FORMAT);
  })
  date: string;

  @Expose()
  imageUrls?: string[] | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    const staff = obj.staff;
    if (!staff) return null;

    const account = staff.account;
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
        firstName: staff.firstName,
        lastName: staff.lastName,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      },
    };
  })
  staff?: {
    id: string;
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
    };
  };

  @Expose()
  @Transform(({ obj }) => {
    const booking = obj.booking;
    if (!booking) return null;
    return {
      id: booking.id,
      customerId: booking.customerId,
      vehicleId: booking.vehicleId,
      centerId: booking.centerId,
      shiftId: booking.shiftId,
      totalCost: booking.totalCost,
      status: booking.status,
      note: booking.note,
      bookingDate: booking.bookingDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  })
  booking?: {
    id: string;
    customerId: string;
    vehicleId: string;
    centerId: string;
    shiftId: string;
    totalCost: number;
    status: string;
    note: string | null;
    bookingDate: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

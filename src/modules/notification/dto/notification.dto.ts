import { Expose, Transform } from 'class-transformer';
import { NotificationType } from '@prisma/client';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';

export class NotificationDTO {
  @Expose()
  id: string;

  @Expose()
  accountId: string;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  notification_type: NotificationType;

  @Expose()
  is_read: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const vnTime = toZonedTime(obj.sent_at, VN_TIMEZONE);
    return format(vnTime, VN_DATE_TIME_FORMAT);
  })
  sent_at: string;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.read_at) return null;
    const vnTime = toZonedTime(obj.read_at, VN_TIMEZONE);
    return format(vnTime, VN_DATE_TIME_FORMAT);
  })
  read_at: string | null;

  @Expose()
  created_at: Date;
}

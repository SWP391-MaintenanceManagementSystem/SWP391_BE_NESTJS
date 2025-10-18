import { Expose, Transform } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class NotificationDTO {
  @Expose()
  id: string;

  @Expose()
  accountId: string;

  @Expose()
  content: string;

  @Expose()
  notification_type: NotificationType;

  @Expose()
  is_read: boolean;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  sent_at: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  read_at: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;
}

import { SetMetadata } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

export interface NotificationMetadata {
  type: NotificationType;
  message: string | ((data: any) => string);
  targetUserIdField?: string;
}

export const NOTIFICATION_KEY = 'notification';

export const EmitNotification = (metadata: NotificationMetadata) =>
  SetMetadata(NOTIFICATION_KEY, metadata);

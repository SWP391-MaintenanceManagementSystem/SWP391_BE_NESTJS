import { SetMetadata } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

export interface NotificationItem {
  type: NotificationType;
  title: string | ((data: any) => string);
  message: string | ((data: any) => string);
  targetUserIdField: string;
}

export interface NotificationMetadata {
  type?: NotificationType;
  title?: string | ((data: any) => string);
  message?: string | ((data: any) => string);
  targetUserIdField?: string;
  additional?: NotificationItem[];
}

export const NOTIFICATION_KEY = 'notification';

export const EmitNotification = (metadata: NotificationMetadata) =>
  SetMetadata(NOTIFICATION_KEY, metadata);

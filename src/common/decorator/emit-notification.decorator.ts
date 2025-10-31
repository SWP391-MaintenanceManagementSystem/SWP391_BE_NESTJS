import { SetMetadata } from '@nestjs/common';
import { NotificationType } from '@prisma/client';

export interface NotificationMetadata {
  type: NotificationType;
  message: string | ((data: any) => string);
  targetUserIdField?: string;
}

export const NOTIFICATION_KEY = 'notification';

export const EmitNotification = (metadata: NotificationMetadata) => {
  let normalizedField = metadata.targetUserIdField;

  if (normalizedField) {
    if (!normalizedField.includes('.') && !normalizedField.includes('[]')) {
      normalizedField = `${normalizedField}[]`;
    } else if (normalizedField.startsWith('data.') && !normalizedField.includes('data[]')) {
      normalizedField = normalizedField.replace('data.', 'data[].');
    }
  }

  return SetMetadata(NOTIFICATION_KEY, {
    ...metadata,
    targetUserIdField: normalizedField,
  });
};

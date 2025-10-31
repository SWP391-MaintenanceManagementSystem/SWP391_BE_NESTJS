import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from 'src/modules/notification/notification.service';
import { NOTIFICATION_KEY, NotificationMetadata } from '../decorator/emit-notification.decorator';

@Injectable()
export class NotificationInterceptor implements NestInterceptor {
  private readonly logger = new Logger('NotificationInterceptor');

  constructor(
    private readonly reflector: Reflector,
    private readonly notificationService: NotificationService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<NotificationMetadata>(
      NOTIFICATION_KEY,
      context.getHandler()
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(async responseData => {
        try {
          console.log('=== Processing Notification ===');
          console.log(`Response data: ${JSON.stringify(responseData, null, 2)}`);

          let targetUserIds: string[] = [];

          if (metadata.targetUserIdField) {
            const value = this.extractNestedValue(responseData, metadata.targetUserIdField);
            console.log(`Extracted value: ${JSON.stringify(value)}`);

            if (Array.isArray(value)) {
              targetUserIds = value
                .map(item => {
                  return item.employeeId || item.accountId || item.customerId || item.id;
                })
                .filter(id => typeof id === 'string');

              console.log(`Extracted user IDs from array: ${targetUserIds}`);
            } else if (typeof value === 'string') {
              targetUserIds = [value];
            } else if (value && typeof value === 'object') {
              const userId = value.employeeId || value.accountId || value.customerId || value.id;
              if (userId) targetUserIds = [userId];
            }
          } else {
            if (user?.sub) {
              targetUserIds = [user.sub];
            }
          }

          if (targetUserIds.length === 0) {
            this.logger.warn('Cannot determine target user IDs for notification');
            return;
          }

          // Send notification to each user
          for (const userId of targetUserIds) {
            console.log(`Sending to user: ${userId}`);

            // Generate message (pass full response data)
            const message =
              typeof metadata.message === 'function'
                ? metadata.message(responseData)
                : metadata.message;

            this.logger.debug(`Generated message: ${message}`);

            await this.notificationService.sendNotification(userId, message, metadata.type);
            console.log(`Notification sent to user ${userId}`);
          }
        } catch (error) {
          this.logger.error('Failed to send notification:', error.stack || error);
        }
      })
    );
  }

  private extractNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const segments = path.split('.');
    let current: any[] = [obj];

    for (const segment of segments) {
      const isArray = segment.endsWith('[]');
      const key = isArray ? segment.slice(0, -2) : segment;

      const next: any[] = [];

      for (const item of current) {
        const value = item?.[key];

        if (Array.isArray(value)) {
          if (isArray) next.push(...value);
          else next.push(value);
        } else if (value !== undefined) {
          next.push(value);
        }
      }

      if (next.length === 0) return undefined;

      current = next;
    }

    return current.length === 1 ? current[0] : current;
  }
}

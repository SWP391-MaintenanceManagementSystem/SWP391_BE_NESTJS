// src/common/interceptor/notification.interceptor.ts
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
          let targetUserIds: string[] = [];

          if (metadata.targetUserIdField) {
            const extracted = this.extractUserIds(responseData, metadata.targetUserIdField);
            targetUserIds = extracted;
            this.logger.debug(`Extracted user IDs: ${JSON.stringify(targetUserIds)}`);
          } else {
            // No field specified = send to current user
            if (user?.sub) {
              targetUserIds = [user.sub];
              this.logger.debug(`Using current user ID: ${user.sub}`);
            }
          }

          if (targetUserIds.length === 0) {
            this.logger.warn('No target user IDs found for notification');
            return;
          }

          // Generate message (pass full response data)
          const message =
            typeof metadata.message === 'function'
              ? metadata.message(responseData)
              : metadata.message;

          this.logger.debug(`Generated message: "${message}"`);

          // Send notification to each user
          for (const userId of targetUserIds) {
            this.logger.debug(`Sending notification to user: ${userId}`);
            await this.notificationService.sendNotification(userId, message, metadata.type);
          }

          this.logger.log(`Notifications sent to ${targetUserIds.length} user(s)`);
        } catch (error) {
          this.logger.error('Failed to send notification:', error.stack || error);
        }
      })
    );
  }

  private extractUserIds(obj: any, path: string): string[] {
    if (!obj || !path) return [];

    this.logger.debug(`Extracting from path: "${path}"`);

    const arrayMatch = path.match(/^(.+?)\[\]\.(.+)$/);
    if (arrayMatch) {
      const [, arrayPath, fieldName] = arrayMatch;
      const array = this.getNestedValue(obj, arrayPath);

      if (Array.isArray(array)) {
        const ids = array
          .map(item => this.getNestedValue(item, fieldName))
          .filter(id => typeof id === 'string' && id.trim() !== '');

        this.logger.debug(`Extracted from array: ${JSON.stringify(ids)}`);
        return ids;
      }
    }
    const value = this.getNestedValue(obj, path);

    if (typeof value === 'string' && value.trim() !== '') {
      return [value];
    }

    if (Array.isArray(value)) {
      return value.filter(id => typeof id === 'string' && id.trim() !== '');
    }

    this.logger.warn(`Could not extract user ID from path: ${path}`);
    return [];
  }

  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }
}

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
    if (!metadata) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return next.handle().pipe(
      tap(responseData => {
        this.sendNotifications(responseData, metadata, user).catch(error => {
          this.logger.error('Failed to send notification:', error.stack || error);
        });
      })
    );
  }

  private async sendNotifications(
    responseData: any,
    metadata: NotificationMetadata,
    user: any
  ): Promise<void> {
    const tasks: Promise<void>[] = [];

    this.logger.debug(`Response data structure: ${JSON.stringify(responseData, null, 2)}`);

    if (metadata.targetUserIdField && metadata.message) {
      const userIds = this.extractUserIds(responseData, metadata.targetUserIdField);

      this.logger.debug(
        `Primary notification - Field: "${metadata.targetUserIdField}", UserIDs: ${JSON.stringify(userIds)}`
      );

      if (userIds.length > 0) {
        const message =
          typeof metadata.message === 'function'
            ? metadata.message(responseData)
            : metadata.message;

        for (const userId of userIds) {
          tasks.push(this.notificationService.sendNotification(userId, message, metadata.type!));
        }
      }
    } else if (!metadata.targetUserIdField && user?.sub && metadata.message) {
      // current user
      const message =
        typeof metadata.message === 'function' ? metadata.message(responseData) : metadata.message;
      tasks.push(this.notificationService.sendNotification(user.sub, message, metadata.type!));
    }

    // additional
    if (metadata.additional?.length) {
      for (const item of metadata.additional) {
        const userIds = this.extractUserIds(responseData, item.targetUserIdField);

        this.logger.debug(
          `Additional notification - Field: "${item.targetUserIdField}", UserIDs: ${JSON.stringify(userIds)}`
        );

        if (userIds.length === 0) continue;

        const message =
          typeof item.message === 'function' ? item.message(responseData) : item.message;

        for (const userId of userIds) {
          tasks.push(this.notificationService.sendNotification(userId, message, item.type));
        }
      }
    }
    this.logger.debug(`Total notification tasks: ${tasks.length}`);

    await Promise.all(tasks);

    this.logger.log(`Successfully sent ${tasks.length} notification(s)`);
  }

  private extractUserIds(obj: any, path: string): string[] {
    if (!obj || !path) return [];

    this.logger.debug(`Extracting from path: "${path}"`);
    const parts = path.split('.');
    let current: any = obj;

    for (const part of parts) {
      if (!current) return [];

      const arrayMatch = part.match(/^(\w+)\[\]$/);
      if (arrayMatch) {
        const key = arrayMatch[1];
        const arrayVal = current[key];

        if (!Array.isArray(arrayVal)) {
          this.logger.warn(`Expected array at "${key}", got ${typeof arrayVal}`);
          return [];
        }

        const remainingPath = parts.slice(parts.indexOf(part) + 1).join('.');
        const ids = arrayVal.flatMap(item => this.extractUserIds(item, remainingPath));
        return ids.filter(id => id != null).map(String);
      }

      current = current[part];
    }

    if (Array.isArray(current)) {
      return current.filter(id => id != null).map(id => String(id));
    }

    if (current != null) {
      return [String(current)];
    }

    this.logger.warn(`Could not extract user ID from path: ${path}`);
    return [];
  }
}

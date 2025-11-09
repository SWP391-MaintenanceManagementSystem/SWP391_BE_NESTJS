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
        const title =
          typeof metadata.title === 'function'
            ? metadata.title(responseData)
            : metadata.title || 'Notification';
        for (const userId of userIds) {
          tasks.push(
            this.notificationService.sendNotification(userId, message, metadata.type!, title)
          );
        }
      }
    } else if (!metadata.targetUserIdField && user?.sub && metadata.message) {
      // current user
      const message =
        typeof metadata.message === 'function' ? metadata.message(responseData) : metadata.message;
      const title =
        typeof metadata.title === 'function'
          ? metadata.title(responseData)
          : metadata.title || 'Notification';
      tasks.push(
        this.notificationService.sendNotification(user.sub, message, metadata.type!, title)
      );
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

        const title = typeof item.title === 'function' ? item.title(responseData) : item.title;

        for (const userId of userIds) {
          tasks.push(this.notificationService.sendNotification(userId, message, item.type, title));
        }
      }
    }
    this.logger.debug(`Total notification tasks: ${tasks.length}`);

    await Promise.all(tasks);

    this.logger.log(`Successfully sent ${tasks.length} notification(s)`);
  }

  private extractUserIds(obj: any, path: string): string[] {
    if (!obj || !path?.trim()) return [];

    const trimmedPath = path.trim();
    this.logger.debug(`Extracting from path: "${trimmedPath}"`);

    // ✅ FIX: Try multiple levels
    const pathsToTry = [
      trimmedPath, // Root: "customerId"
      `data.${trimmedPath}`, // Nested: "data.customerId"
    ];

    for (const tryPath of pathsToTry) {
      const result = this.traversePath(obj, tryPath);

      if (result.length > 0) {
        this.logger.debug(`✅ Found at path "${tryPath}": ${result.length} ID(s)`);
        return result;
      }
    }

    this.logger.warn(`❌ Could not extract user ID from any path: ${trimmedPath}`);
    return [];
  }

  // ✅ NEW: Helper method to traverse path
  private traversePath(obj: any, path: string): string[] {
    const parts = path.split('.').filter(p => p.length > 0);
    let current: any = obj;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (current == null) return [];

      // Handle array syntax: users[]
      const arrayMatch = part.match(/^(\w+)\[\]$/);
      if (arrayMatch) {
        const key = arrayMatch[1];
        const arrayVal = current[key];

        if (!Array.isArray(arrayVal)) {
          return [];
        }

        const remainingPath = parts.slice(i + 1).join('.');
        if (remainingPath === '') {
          // e.g., "users[]" → return array of values
          return arrayVal
            .filter(item => item != null)
            .map(item => String(item).trim())
            .filter(id => id.length > 0);
        }

        // Recurse into each array item
        const results = arrayVal.flatMap(item => this.traversePath(item, remainingPath));
        return results.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
      }

      // Normal object key
      current = current[part];
    }

    // Final value
    if (Array.isArray(current)) {
      return current
        .filter(id => id != null)
        .map(id => String(id).trim())
        .filter(id => id.length > 0);
    }

    if (current != null) {
      const id = String(current).trim();
      return id.length > 0 ? [id] : [];
    }

    return [];
  }
}

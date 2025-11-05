import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDTO } from './dto/create-notification.dto';
import { UpdateNotificationDTO } from './dto/update-notification.dto';
import { NotificationDTO } from './dto/notification.dto';
import { NotificationQueryDTO } from './dto/notification-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';
import { NotificationGateway } from 'src/common/socket/notification.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('NotificationService');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly notificationGateway: NotificationGateway
  ) {}

  async sendNotification(
    accountId: string,
    content: string,
    type: NotificationType,
    title: string
  ): Promise<void> {
    console.log('=== sendNotification ===');
    console.log(`accountId: ${accountId} (type: ${typeof accountId})`);
    console.log(`content: ${content}`);
    console.log(`type: ${type}`);

    if (typeof accountId !== 'string' || !accountId.trim()) {
      this.logger.error(`Invalid accountId: ${accountId}`);
      throw new BadRequestException('Invalid accountId');
    }

    // Validate content
    if (!content || content.trim() === '') {
      throw new BadRequestException('Notification content cannot be empty');
    }

    if (content.length > 500) {
      content = content.substring(0, 497) + '...';
    }

    try {
      const notification = await this.prisma.notification.create({
        data: {
          accountId,
          title,
          content,
          notification_type: type,
          is_read: false,
        },
      });
      console.log(`Notification created: ${notification.id}`);

      // Send real-time notification via WebSocket
      console.log('Sending via WebSocket...');
      this.notificationGateway.sendNotificationWithData(accountId, {
        id: notification.id,
        title: notification.title,
        content: notification.content,
        notification_type: notification.notification_type,
        sent_at: notification.sent_at,
      });
      this.logger.log(`WebSocket notification sent to ${accountId}`);
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error; // Re-throw to see error in interceptor
    }
  }

  async sendBulkNotifications(
    accountIds: string[],
    content: string,
    type: NotificationType,
    title: string
  ): Promise<void> {
    if (accountIds.length === 0) return;

    try {
      // Create notifications in bulk
      await this.prisma.notification.createMany({
        data: accountIds.map(accountId => ({
          accountId,
          title,
          content,
          notification_type: type,
          is_read: false,
        })),
      });

      // Send real-time notifications
      accountIds.forEach(accountId => {
        this.notificationGateway.sendNotificationWithData(accountId, {
          content,
          notification_type: type,
          sent_at: new Date().toISOString(),
        });
      });
    } catch (error) {
      this.logger.error('Failed to send bulk notifications:', error);
    }
  }

  async createNotification(
    accountId: string,
    createData: CreateNotificationDTO
  ): Promise<NotificationDTO> {
    const { title, content, notification_type } = createData;

    console.log(`accountId: ${accountId}, content: ${content}, type: ${notification_type}`);

    // Validate content
    if (content.length > 500) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { content: 'Content must not exceed 500 characters' },
      });
    }

    // Verify account exists
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException({
        message: 'Validation failed',
        errors: { accountId: 'Account not found' },
      });
    }

    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        accountId,
        title,
        content,
        notification_type,
        is_read: false,
      },
    });

    console.log('Notification created:', notification);

    // Send real-time notification
    try {
      this.notificationGateway.sendNotificationWithData(accountId, {
        id: notification.id,
        content: notification.content,
        notification_type: notification.notification_type,
        sent_at: notification.sent_at,
      });
      console.log(`Real-time notification sent to user ${accountId}`);
    } catch (error) {
      this.logger.error('Failed to send real-time notification:', error);
    }

    return plainToInstance(NotificationDTO, notification, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Get notifications for current user with pagination
   */
  async getNotifications(
    accountId: string,
    filter: NotificationQueryDTO
  ): Promise<PaginationResponse<NotificationDTO>> {
    const {
      is_read,
      title,
      content,
      notification_type,
      orderBy = 'desc',
      sortBy = 'sent_at',
      page = 1,
      pageSize = 10,
    } = filter;

    const where: any = { accountId };

    if (is_read !== undefined) where.is_read = is_read === true;
    if (notification_type) where.notification_type = notification_type;
    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (content) where.content = { contains: content, mode: 'insensitive' };

    const total = await this.prisma.notification.count({ where });

    const notifications = await this.prisma.notification.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: orderBy },
    });

    const items = notifications.map(notification =>
      plainToInstance(NotificationDTO, notification, {
        excludeExtraneousValues: true,
      })
    );

    return {
      data: items,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getNotificationById(id: string, accountId: string): Promise<NotificationDTO> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { id: 'Notification ID must be a valid UUID' },
      });
    }

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.accountId !== accountId) {
      throw new NotFoundException('Notification not found');
    }

    return plainToInstance(NotificationDTO, notification, {
      excludeExtraneousValues: true,
    });
  }

  async getUnreadCount(accountId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        accountId,
        is_read: false,
      },
    });

    return { count };
  }

  async updateNotification(
    id: string,
    updateData: UpdateNotificationDTO
  ): Promise<NotificationDTO> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: updateData,
    });

    return plainToInstance(NotificationDTO, updated, {
      excludeExtraneousValues: true,
    });
  }

  async markAsRead(notificationId: string, accountId: string): Promise<NotificationDTO> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.accountId !== accountId) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.is_read) {
      // Already read, just return
      return plainToInstance(NotificationDTO, notification, {
        excludeExtraneousValues: true,
      });
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    this.notificationGateway.emitNotificationRead(accountId, notificationId);

    return plainToInstance(NotificationDTO, updated, {
      excludeExtraneousValues: true,
    });
  }

  async markAllAsRead(accountId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        accountId,
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    this.notificationGateway.emitAllNotificationsRead(accountId);

    return { count: result.count };
  }

  async deleteNotification(notificationId: string, accountId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.accountId !== accountId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    // Emit real-time update via WebSocket
    this.notificationGateway.emitNotificationDeleted(accountId, notificationId);
  }

  async deleteAllNotifications(accountId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: { accountId },
    });

    return { count: result.count };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDTO } from './dto/create-notification.dto';
import { UpdateNotificationDTO } from './dto/update-notification.dto';
import { NotificationDTO } from './dto/notification.dto';
import { NotificationQueryDTO } from './dto/notification-query.dto';
import { PaginationResponse } from 'src/common/dto/pagination-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(createData: CreateNotificationDTO): Promise<NotificationDTO> {
    const { accountId, content, notification_type } = createData;

    const errors: Record<string, string> = {};

    // Validate accountId
    if (!accountId || accountId.trim() === '') {
      errors.accountId = 'Account ID is required and cannot be empty';
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(accountId)) {
        errors.accountId = 'Account ID must be a valid UUID';
      }
    }

    // Validate content
    if (!content || content.trim() === '') {
      errors.content = 'Content is required and cannot be empty';
    } else if (content.length > 500) {
      errors.content = 'Content must not exceed 500 characters';
    }

    // Validate notification_type
    if (!notification_type) {
      errors.notification_type = 'Notification type is required';
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors,
      });
    }

    const notification = await this.prisma.notification.create({
      data: {
        accountId,
        content,
        notification_type,
        is_read: false,
      },
    });

    return plainToInstance(NotificationDTO, notification, {
      excludeExtraneousValues: true,
    });
  }

  async getNotifications(
    filter: NotificationQueryDTO
  ): Promise<PaginationResponse<NotificationDTO>> {
    const {
      accountId,
      is_read,
      notification_type,
      orderBy = 'asc',
      sortBy = 'createdAt',
      page = 1,
      pageSize = 10,
    } = filter;

    const where: any = {};

    if (accountId) where.accountId = accountId;
    if (is_read !== undefined) where.is_read = is_read === true;
    if (notification_type) where.notification_type = notification_type;

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

  async getNotificationById(id: string): Promise<NotificationDTO> {
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

    return plainToInstance(NotificationDTO, notification, {
      excludeExtraneousValues: true,
    });
  }

  async updateNotification(
    id: string,
    updateData: UpdateNotificationDTO
  ): Promise<NotificationDTO> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: { id: 'Notification ID must be a valid UUID' },
      });
    }

    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found');
    }

    const { is_read } = updateData;
    const data: any = {};

    if (is_read !== undefined) {
      data.is_read = is_read;
      if (is_read && !existing.read_at) {
        data.read_at = new Date();
      }
    }

    const notification = await this.prisma.notification.update({
      where: { id },
      data,
    });

    return plainToInstance(NotificationDTO, notification, {
      excludeExtraneousValues: true,
    });
  }

  // Hard delete
  async deleteNotification(id: string): Promise<void> {
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

    await this.prisma.notification.delete({
      where: { id },
    });
  }
}

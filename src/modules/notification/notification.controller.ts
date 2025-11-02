import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDTO } from './dto/create-notification.dto';
import { NotificationQueryDTO } from './dto/notification-query.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from 'src/common/guard/role.guard';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { JWT_Payload } from 'src/common/types';

@ApiTags('Notifications')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create notification for current user',
    description: 'Creates a notification for the authenticated user',
  })
  async create(
    @Body() createNotificationDto: CreateNotificationDTO,
    @CurrentUser() user: JWT_Payload
  ) {
    const data = await this.notificationService.createNotification(user.sub, createNotificationDto);
    return {
      message: 'Notification created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all notifications for current user',
    description: 'Retrieves paginated notifications for the authenticated user',
  })
  async findAll(@Query() query: NotificationQueryDTO, @CurrentUser() user: JWT_Payload) {
    const data = await this.notificationService.getNotifications(user.sub, query);
    return {
      message: 'Notifications retrieved successfully',
      ...data,
    };
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count',
    description: 'Returns the count of unread notifications for current user',
  })
  async getUnreadCount(@CurrentUser() user: JWT_Payload) {
    const data = await this.notificationService.getUnreadCount(user.sub);
    return {
      message: 'Unread count retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
  })
  async findOne(@Param('id') id: string, @CurrentUser() user: JWT_Payload) {
    const data = await this.notificationService.getNotificationById(id, user.sub);
    return {
      message: 'Notification retrieved successfully',
      data,
    };
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
  })
  async markAsRead(@Param('id') id: string, @CurrentUser() user: JWT_Payload) {
    const data = await this.notificationService.markAsRead(id, user.sub);
    return {
      message: 'Notification marked as read',
      data,
    };
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all notifications as read',
  })
  async markAllAsRead(@CurrentUser() user: JWT_Payload) {
    const data = await this.notificationService.markAllAsRead(user.sub);
    return {
      message: `${data.count} notifications marked as read`,
      data,
    };
  }

  @Delete(':id')
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUser() accountId: JWT_Payload
  ) {
    await this.notificationService.deleteNotification(notificationId, accountId.sub);
  }

  @Delete()
  async deleteAllNotifications(@CurrentUser() accountId: JWT_Payload) {
    const result = await this.notificationService.deleteAllNotifications(accountId.sub);
    return {
      message: `${result.count} notification(s) deleted`,
      ...result,
    };
  }
}

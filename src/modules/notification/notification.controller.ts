import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDTO } from './dto/create-notification.dto';
import { UpdateNotificationDTO } from './dto/update-notification.dto';
import { NotificationQueryDTO } from './dto/notification-query.dto';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDTO) {
    const data = await this.notificationService.createNotification(createNotificationDto);
    return {
      message: 'Notification created successfully',
      data,
    };
  }

  @Get()
  async findAll(@Query() query: NotificationQueryDTO) {
    const data = await this.notificationService.getNotifications(query);
    return {
      message: 'Notifications retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.notificationService.getNotificationById(id);
    return {
      message: 'Notification retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDTO) {
    const data = await this.notificationService.updateNotification(id, updateNotificationDto);
    return {
      message: 'Notification updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.notificationService.deleteNotification(id);
    return {
      message: 'Notification deleted successfully',
    };
  }
}

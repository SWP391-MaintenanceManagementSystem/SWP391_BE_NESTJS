import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';
import { Order } from 'src/common/sort/sort.config';

export class NotificationQueryDTO {
  @ApiPropertyOptional({
    required: false,
    description: 'Account ID associated with the notification',
  })
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Mark notification as read',
  })
  @IsOptional()
  is_read?: boolean;

  @ApiPropertyOptional({
    required: false,
    description: 'Type of the notification',
    enum: NotificationType,
  })
  @IsOptional()
  notification_type?: NotificationType;

  @ApiPropertyOptional({
    required: false,
    description: 'Timestamp when the notification was sent',
    example: '2024-01-20T08:00:00.000Z',
  })
  @IsOptional()
  sent_at?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Timestamp when the notification was read',
    example: '2024-01-20T08:00:00.000Z',
  })
  @IsOptional()
  read_at?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Sort order example: "sent_at" ',
    type: String,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Sort order example: "asc"',
    type: String,
  })
  @IsOptional()
  @IsString()
  orderBy?: Order;

  @ApiPropertyOptional({ required: false, description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ required: false, description: 'Page size', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}

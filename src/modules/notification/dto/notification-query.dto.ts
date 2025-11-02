import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';
import { Order } from 'src/common/sort/sort.config';

export class NotificationQueryDTO {
  @ApiPropertyOptional({
    required: false,
    description: 'Mark notification as read',
  })
  @IsOptional()
  @Type(() => Boolean)
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
    description: 'Field to sort by',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Order direction',
  })
  @IsOptional()
  orderBy?: Order;

  @ApiPropertyOptional({
    required: false,
    description: 'Page number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}

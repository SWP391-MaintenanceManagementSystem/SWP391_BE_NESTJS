import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationType } from '@prisma/client';
import { Order } from 'src/common/sort/sort.config';

export class NotificationQueryDTO {
  @ApiPropertyOptional({
    required: false,
    description: 'Mark notification as read',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  is_read?: boolean;

  @ApiPropertyOptional({
    required: false,
    description: 'Title',
  })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Content',
  })
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Search for title and content',
  })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    required: false,
    enum: NotificationType,
    isArray: true,
    example: ['BOOKING', 'PAYMENT'],
  })
  @IsOptional()
  @IsEnum(NotificationType, { each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return value.split(',').map((v: string) => v.trim().toUpperCase());
  })
  notification_type?: NotificationType[];

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

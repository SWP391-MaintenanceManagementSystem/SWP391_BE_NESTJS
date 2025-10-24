import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID, Min } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';

export class TechnicianBookingQueryDTO {
  @IsOptional()
  @IsEnum(BookingStatus, {
    message: `status must be one of ${Object.values(BookingStatus).join(', ')}`,
  })
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    example: BookingStatus.ASSIGNED,
    enum: [
      BookingStatus.ASSIGNED,
      BookingStatus.CHECKED_IN,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED,
    ],
  })
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Search by customer name, vehicle, or booking details',
    example: 'John',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter bookings from this date (ISO 8601 format)',
    example: '2025-10-01T00:00:00Z',
  })
  fromDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Filter bookings until this date (ISO 8601 format)',
    example: '2025-10-31T23:59:59Z',
  })
  toDate?: string;

  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({
    description: 'Filter by service center ID',
    example: 'afc98a4e-26f9-45bb-9767-38e391f6a40d',
  })
  centerId?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  page?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  pageSize?: number;

  @ApiPropertyOptional({
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Sort order direction: ASC or DESC',
  })
  @IsOptional()
  @Type(() => String)
  orderBy?: Order;
}

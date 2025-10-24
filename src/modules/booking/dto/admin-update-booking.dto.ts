import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsPositive,
  IsUUID,
  IsString,
  MaxLength,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateBookingDTO {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'Customer prefers afternoon slot' })
  note?: string;

  @IsOptional()
  @IsDateString({}, { message: 'bookingDate must be a valid ISO 8601 date string' })
  @ApiPropertyOptional({
    example: '2025-10-08T13:30:00Z',
    description: 'Booking date and time in ISO 8601 format',
  })
  bookingDate?: string;

  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ example: 'f1d23654-07fa-4b3e-9e0d-f2e32baf6a90' })
  vehicleId?: string;

  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ example: 'afc98a4e-26f9-45bb-9767-38e391f6a40d' })
  centerId?: string;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 100 })
  totalCost?: number;

  @IsOptional()
  @IsEnum(BookingStatus, {
    message: `status must be one of ${Object.values(BookingStatus).join(', ')}`,
  })
  @ApiPropertyOptional({ example: BookingStatus.ASSIGNED, enum: BookingStatus })
  status?: BookingStatus;
}

import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { BookingQueryDTO } from './booking-query.dto';
import { BookingStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class BookingHistoryQueryDTO extends BookingQueryDTO {
  @ApiProperty({
    required: false,
    description: 'Filter by Vehicle ID',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({
    required: false,
    enum: [BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED],
    description: 'Filter bookings by status CHECKED_OUT or CANCELLED',
  })
  @IsOptional()
  @IsIn([BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED])
  status?: BookingStatus;

  @ApiProperty({
    required: false,
    description: 'Filter by Customer ID',
  })
  @IsOptional()
  @IsString()
  customerId?: string;
}

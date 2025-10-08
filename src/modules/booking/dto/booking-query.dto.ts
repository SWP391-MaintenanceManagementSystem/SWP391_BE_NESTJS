import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from 'src/common/sort/sort.config';

export class BookingQueryDTO {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Search bookings by customer email, name, vehicle model, or license plate',
  })
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Filter bookings by service center ID',
  })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiProperty({
    required: false,
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  shiftId?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @Type(() => Date)
  bookingDate?: Date;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  orderBy?: string;

  @ApiProperty({
    required: false,
    description: 'Sort order direction: ASC or DESC',
  })
  @IsOptional()
  @Type(() => String)
  sortBy?: Order;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Page number for pagination (starts from 1)',
  })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    required: false,
    example: 10,
    description: 'Number of records per page for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;
}

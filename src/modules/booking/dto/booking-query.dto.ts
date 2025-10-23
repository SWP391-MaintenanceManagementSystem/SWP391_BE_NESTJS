import { BookingStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
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
    description: 'Filter bookings from this date (yyyy-mm-dd)',
  })
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiProperty({
    required: false,
    description: 'Filter bookings until this date (yyyy-mm-dd)',
  })
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isPremium?: boolean;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    required: false,
    description: 'Sort order direction: ASC or DESC',
  })
  @IsOptional()
  @Type(() => String)
  orderBy?: Order;

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

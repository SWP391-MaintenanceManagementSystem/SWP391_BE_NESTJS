import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class StaffUpdateBookingDTO {
  @IsOptional()
  @IsEnum(BookingStatus)
  @ApiProperty({
    example: BookingStatus.CONFIRMED,
    required: false,
  })
  status?: BookingStatus;
}

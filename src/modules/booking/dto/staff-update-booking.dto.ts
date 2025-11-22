import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class StaffUpdateBookingDTO {
  @IsOptional()
  @IsEnum(BookingStatus)
  @ApiProperty({
    example: BookingStatus.ASSIGNED,
    required: false,
  })
  status?: BookingStatus;

  @IsOptional()
  @ApiProperty({
    example: ['serviceId1', 'serviceId2'],
    required: false,
  })
  serviceIds?: string[];

  @IsOptional()
  @ApiProperty({
    example: ['packageId1', 'packageId2'],
    required: false,
  })
  packageIds?: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class CustomerUpdateBookingDTO {
  @IsOptional()
  @ApiProperty({
    example: 'Customer prefers afternoon slot',
    required: false,
  })
  note?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    example: '2025-10-08T13:30:00Z',
    required: false,
    description: 'Booking date and time in ISO 8601 format',
  })
  bookingDate?: string;

  @IsOptional()
  @ApiProperty({
    example: 'f1d23654-07fa-4b3e-9e0d-f2e32baf6a90',
    required: false,
  })
  vehicleId?: string;

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

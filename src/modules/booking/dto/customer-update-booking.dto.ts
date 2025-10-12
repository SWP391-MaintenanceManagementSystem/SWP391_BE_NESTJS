import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class CustomerUpdateBookingDTO {
  @IsOptional()
  @ApiProperty({
    example: 'Customer prefers afternoon slot',
    required: false,
  })
  note?: string;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    example: '2025-10-08T13:30:00Z',
    required: false,
  })
  bookingDate?: Date;

  @IsOptional()
  @ApiProperty({
    example: 'f1d23654-07fa-4b3e-9e0d-f2e32baf6a90',
    required: false,
  })
  vehicleId?: string;
}

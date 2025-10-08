import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class CreateBookingDetailDTO {
  @IsUUID()
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'The booking ID this detail belongs to',
  })
  bookingId: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf(o => !o.packageId)
  @ApiProperty({
    example: 'svc_1234567890',
    description: 'Service ID if the detail is for a single service',
    required: false,
  })
  serviceId?: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf(o => !o.serviceId)
  @ApiProperty({
    example: 'pkg_9876543210',
    description: 'Package ID if the detail is for a package (combo of services)',
    required: false,
  })
  packageId?: string;

  @IsNumber()
  @ApiProperty({
    example: 1,
    description: 'Quantity of the service or package booked',
  })
  quantity: number;

  @IsNumber()
  @ApiProperty({
    example: 150000,
    description: 'Unit price per item (0 if free via membership)',
  })
  unitPrice: number;
}

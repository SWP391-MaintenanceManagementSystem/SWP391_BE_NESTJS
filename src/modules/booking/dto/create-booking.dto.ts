import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDTO {
  @IsUUID()
  @ApiProperty({
    example: 'cb1fb34f-6cdb-4543-b3ca-74176865a910',
  })
  customerId: string;

  @IsUUID()
  @ApiProperty({
    example: 'f1d23654-07fa-4b3e-9e0d-f2e32baf6a90',
  })
  vehicleId: string;

  @IsUUID()
  @ApiProperty({
    example: 'afc98a4e-26f9-45bb-9767-38e391f6a40d',
  })
  centerId: string;

  @Type(() => Date)
  @IsDate()
  @ApiProperty({
    example: '2025-10-08T09:30:00Z',
  })
  bookingDate: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Customer prefers morning slot',
    required: false,
  })
  note?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ApiProperty({
    type: [String],
    example: ['uuid-service-1', 'uuid-service-2'],
    required: false,
  })
  serviceIds?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @ApiProperty({
    type: [String],
    example: ['uuid-package-1'],
    required: false,
  })
  packageIds?: string[];
}

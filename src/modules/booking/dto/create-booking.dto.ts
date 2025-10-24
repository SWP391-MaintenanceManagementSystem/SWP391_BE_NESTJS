import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDTO {
  @IsUUID()
  @ApiProperty({ example: 'f1d23654-07fa-4b3e-9e0d-f2e32baf6a90' })
  vehicleId: string;

  @IsUUID()
  @ApiProperty({ example: 'afc98a4e-26f9-45bb-9767-38e391f6a40d' })
  centerId: string;

  @IsDateString()
  @ApiProperty({
    example: '2025-10-26T07:11',
    description: 'Date and time in ISO 8601 format',
  })
  bookingDate: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Customer prefers morning slot',
    required: false,
  })
  note?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  @ApiProperty({ type: [String], example: ['uuid-service-1', 'uuid-service-2'], required: false })
  serviceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ApiProperty({ type: [String], example: ['uuid-package-1'], required: false })
  packageIds?: string[];
}

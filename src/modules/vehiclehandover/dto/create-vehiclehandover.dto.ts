import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsInt,
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  Min,
  ArrayUnique,
} from 'class-validator';

export class CreateVehicleHandoverDTO {
  @ApiProperty({ example: 'uuid-booking' })
  @IsUUID()
  @IsNotEmpty({ message: 'bookingId is required' })
  bookingId: string;

  // @ApiProperty({ example: 'uuid-staff' })
  // @IsUUID()
  // @IsNotEmpty({ message: 'staffId is required' })
  // staffId: string;

  @ApiProperty({
    example: 15000,
    description: 'Vehicle odometer reading (km)',
  })
  @IsInt()
  @Min(0)
  @IsNotEmpty({ message: 'odometer is required' })
  odometer: number;

  @ApiPropertyOptional({ example: 'note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: ['description-1', 'description-2'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true, message: 'Each description must be a string' })
  @ArrayUnique({ message: 'Descriptions must be unique' })
  description?: string[];

  @ApiProperty({ example: '2025-10-26T14:30' })
  @IsDateString()
  @IsNotEmpty({ message: 'handover date is required' })
  date: string;
}

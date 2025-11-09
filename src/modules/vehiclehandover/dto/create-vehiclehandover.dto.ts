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
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateVehicleHandoverDTO {
  @ApiProperty({ example: 'uuid-booking' })
  @IsUUID()
  @IsNotEmpty({ message: 'bookingId is required' })
  bookingId: string;

  @ApiProperty({
    example: 15000,
    description: 'Vehicle odometer reading (km)',
  })
  @Type(() => Number)
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
  @Transform(({ value }) => {
    // Handle multipart/form-data: convert string to array
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [value];
      }
    }
    return value;
  })
  @IsString({ each: true, message: 'Each description must be a string' })
  @ArrayUnique({ message: 'Descriptions must be unique' })
  description?: string[];

  @ApiProperty({ example: '2025-10-26T14:30' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, {
    message: "Invalid date format. Use 'yyyy-MM-ddTHH:mm'",
  })
  @IsDateString()
  @IsNotEmpty({ message: 'date is required' })
  date: string;

  // Removed imageUrls field - only accept file uploads via FormData
}

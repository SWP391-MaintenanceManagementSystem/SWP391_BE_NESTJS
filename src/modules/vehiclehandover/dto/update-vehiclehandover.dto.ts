import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateVehicleHandoverDTO {
  @ApiPropertyOptional({ example: 'uuid-booking' })
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Vehicle odometer reading (km)',
  })
  @IsOptional()
  @Type(() => Number)
  odometer?: number;

  @ApiPropertyOptional({ example: 'note' })
  @IsOptional()
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
  description?: string[];

  @ApiPropertyOptional({ example: '2025-10-26T14:30' })
  @IsOptional()
  date?: string;

  // Removed imageUrls field - only accept file uploads via FormData
}

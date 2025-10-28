import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateVehicleHandoverDTO {
  @ApiPropertyOptional({ example: 'uuid-booking' })
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({
    example: 15000,
    description: 'Vehicle odometer reading (km)',
  })
  @IsOptional()
  odometer?: number;

  @ApiPropertyOptional({ example: 'note' })
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ example: ['description-1', 'description-2'], type: [String] })
  @IsOptional()
  description?: string[];

  @ApiPropertyOptional({ example: '2025-10-26T14:30' })
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    example: [
      'https://res.cloudinary.com/.../image1.jpg',
      'https://res.cloudinary.com/.../image2.jpg',
    ],
  })
  @IsOptional()
  @IsString({ each: true })
  imageUrls?: string[] | null;
}

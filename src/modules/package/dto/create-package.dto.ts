import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePackageDto {
  @ApiProperty({ example: 'Basic Maintenance Package', description: 'Name of the package' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount rate in percentage (0–100)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountRate?: number;

  @ApiProperty({
    type: [String],
    example: ['svc_123', 'svc_456'],
    description: 'List of service IDs to include in this package',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  serviceIds: string[];
}

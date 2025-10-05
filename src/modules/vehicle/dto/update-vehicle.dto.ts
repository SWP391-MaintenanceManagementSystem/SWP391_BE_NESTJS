import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { IsOptional, IsNumber, Matches, IsString } from 'class-validator';

export class UpdateVehicleDTO {
  @ApiPropertyOptional({
    description: 'Vehicle Identification Number (VIN)',
    example: '1HGCM82633A004352',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-HJ-NPR-Z0-9]{17}$/, {
    message: 'VIN must be exactly 17 characters (A-H, J-N, P, R-Z, 0-9), excluding I, O, Q',
  })
  vin?: string;

  @ApiPropertyOptional({
    description: 'License plate number of the vehicle',
    example: '51H-12345',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2,3}[A-Z]-\d{4,5}$/, {
    message: 'License plate must follow the VN format (e.g., 51H-12345)',
  })
  licensePlate?: string;

  @ApiPropertyOptional({
    description: 'ID of the vehicle model',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  modelId?: number;
  @ApiPropertyOptional({
    description: 'Status of the vehicle',
    example: 'ACTIVE',
    enum: VehicleStatus,
  })
  @IsOptional()
  @IsString()
  status?: VehicleStatus;
}

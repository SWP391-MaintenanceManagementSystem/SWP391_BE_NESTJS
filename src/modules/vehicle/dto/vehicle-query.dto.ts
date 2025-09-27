import { ApiProperty } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class VehicleQueryDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: 'Filter by brand ID' })
  brandId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: 'Filter by model ID' })
  modelId?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Filter by VIN' })
  vin?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Filter by license plate' })
  licensePlate?: string;

  @IsOptional()
  @IsEnum(VehicleStatus)
  @ApiProperty({ required: false, description: 'Filter by vehicle status', enum: VehicleStatus })
  status?: VehicleStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: 'Filter by page number', example: 1 })
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ required: false, description: 'Filter by page size', example: 10 })
  pageSize?: number;
}

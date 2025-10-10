import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';

export class ShiftQueryDTO {
  @ApiProperty({ required: false, description: 'Filter by shift ID' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ required: false, description: 'Filter by center ID' })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiProperty({ required: false, description: 'Filter by shift name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by start time (HH:mm:ss)',
  })
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'startTime must be in format HH:mm:ss',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Filter by end time (HH:mm:ss)',
  })
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'endTime must be in format HH:mm:ss',
  })
  endTime?: string;

  @ApiProperty({ required: false, description: 'Filter by shift status', enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ required: false, description: 'Filter by Order (asc or desc)' })
  @IsOptional()
  orderBy?: Order;

  @ApiPropertyOptional({
    required: false,
    description: 'Filter by Sort field',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, description: 'Filter by page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, description: 'Filter by page size', example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

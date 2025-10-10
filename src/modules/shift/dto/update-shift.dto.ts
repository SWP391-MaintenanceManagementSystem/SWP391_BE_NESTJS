import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ShiftStatus } from '@prisma/client';

export class UpdateShiftDTO {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @ApiPropertyOptional({
    example: 'Morning Shift',
    description: 'Shift name',
  })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Start time must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-01T08:00:00.000Z',
    description: 'Shift start time',
  })
  startTime?: string;

  @IsOptional()
  @IsString({ message: 'End time must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-01T17:00:00.000Z',
    description: 'Shift end time',
  })
  endTime?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Maximum slot must be a number' })
  @Min(1, { message: 'Maximum slot must be at least 1' })
  @Max(50, { message: 'Maximum slot cannot exceed 50' })
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of technicians for this shift',
  })
  maximumSlot?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ example: 'Center Id', description: 'Center Id' })
  @IsOptional()
  @IsString({ message: 'Center Id must be a string' })
  centerId?: string;
}

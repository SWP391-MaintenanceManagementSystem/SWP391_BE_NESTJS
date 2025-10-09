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
  @IsString({ message: 'Start date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Shift start date (optional)',
  })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Shift end date (optional)',
  })
  endDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Maximum slot must be a number' })
  @Min(1, { message: 'Maximum slot must be at least 1' })
  @Max(50, { message: 'Maximum slot cannot exceed 50' })
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of technicians for this shift',
  })
  maximumSlot?: number;

  @IsOptional()
  @IsArray({ message: 'Repeat days must be an array' })
  @ArrayMinSize(1, { message: 'At least one day must be selected' })
  @ArrayMaxSize(7, { message: 'Cannot have more than 7 days' })
  @IsInt({ each: true, message: 'Each day must be an integer' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(day => parseInt(day.trim()));
    }
    if (Array.isArray(value)) {
      return value.map(day => parseInt(day));
    }
    return value;
  })
  @ApiPropertyOptional({
    example: [1, 3, 5],
    description: 'Days of the week the shift repeats (0=Sunday, 1=Monday, ..., 6=Saturday)',
    type: [Number],
  })
  repeatDays?: number[];

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ example: 'Center Id', description: 'Center Id' })
  @IsOptional()
  @IsString({ message: 'Center Id must be a string' })
  centerId?: string;
}

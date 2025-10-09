import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateShiftDTO {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @ApiProperty({
    example: 'Morning Shift',
    description: 'Shift name',
  })
  name: string;

  @IsDateString({}, { message: 'Start time must be a valid date string' })
  @ApiProperty({
    example: '2025-11-01T08:00:00.000Z',
    description: 'Shift start time',
  })
  startTime: string;

  @IsDateString({}, { message: 'End time must be a valid date string' })
  @ApiProperty({
    example: '2025-11-01T17:00:00.000Z',
    description: 'Shift end time',
  })
  endTime: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Shift start date (optional)',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
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

  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Center ID is required' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Service center UUID',
  })
  centerId: string;
}

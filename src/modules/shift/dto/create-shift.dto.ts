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
  @IsNumber({}, { message: 'Maximum slot must be a number' })
  @Min(1, { message: 'Maximum slot must be at least 1' })
  @Max(50, { message: 'Maximum slot cannot exceed 50' })
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of technicians for this shift',
  })
  maximumSlot?: number;

  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Center ID is required' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Service center UUID',
  })
  centerId: string;
}

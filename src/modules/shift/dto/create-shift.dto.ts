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
  Matches
} from 'class-validator';

export class CreateShiftDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @ApiProperty({
    example: 'Morning Shift',
    description: 'Shift name'
  })
  name: string;

  @IsDateString({}, { message: 'Start time must be a valid date string' })
  @ApiProperty({
    example: '2024-01-01T08:00:00.000Z',
    description: 'Shift start time'
  })
  startTime: string;

  @IsDateString({}, { message: 'End time must be a valid date string' })
  @ApiProperty({
    example: '2024-01-01T17:00:00.000Z',
    description: 'Shift end time'
  })
  endTime: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Shift start date (optional)'
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Shift end date (optional)'
  })
  endDate?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Maximum slot must be a number' })
  @Min(1, { message: 'Maximum slot must be at least 1' })
  @Max(50, { message: 'Maximum slot cannot exceed 50' })
  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum number of technicians for this shift'
  })
  maximumSlot?: number;

  @IsOptional()
  @IsString({ message: 'Repeat days must be a string' })
  @Matches(/^[0-6](,[0-6])*$/, {
    message: 'Repeat days must be comma-separated numbers (0-6, where 0=Sunday)'
  })
  @ApiPropertyOptional({
    example: '1,3,5',
    description: 'Days of the week the shift repeats (0=Sunday, 1=Monday, ..., 6=Saturday)'
  })
  repeatDays?: string;

  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Center ID is required' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Service center UUID'
  })
  centerId: string;
}

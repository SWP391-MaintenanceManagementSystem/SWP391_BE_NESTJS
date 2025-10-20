import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateCyclicWorkScheduleDTO {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee account UUID',
  })
  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

  @ApiProperty({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Shift UUID',
  })
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Shift ID is required' })
  shiftId: string;

  @ApiProperty({
    example: '2025-10-11',
    description: 'Start date in YYYY-MM-DD format',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @ApiProperty({
    example: '2025-10-17',
    description: 'End date in YYYY-MM-DD format',
  })
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'Days of week to repeat (0=Sunday, 1=Monday, ..., 6=Saturday)',
    type: [Number],
  })
  @IsArray({ message: 'Repeat days must be an array' })
  @ArrayMinSize(1, { message: 'At least one repeat day is required' })
  @ArrayMaxSize(7, { message: 'Maximum 7 repeat days allowed' })
  @IsInt({ each: true, message: 'Each repeat day must be an integer' })
  @Min(0, { each: true, message: 'Each repeat day must be between 0 and 6' })
  @Max(6, { each: true, message: 'Each repeat day must be between 0 and 6' })
  repeatDays: number[];
}

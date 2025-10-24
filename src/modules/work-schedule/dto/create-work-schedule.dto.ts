import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

export class CreateWorkScheduleDTO {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Shift ID is required and cannot be empty' })
  shiftId: string;

  @ApiProperty({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
  })
  @IsUUID(4, { message: 'Service Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Service Center ID is required and cannot be empty' })
  centerId: string;

  @ApiProperty({
    type: [String],
    example: ['c7a72f5e-98ab-40b2-bd53-6220cba91c7a', 'a1a72f5e-12ab-40b2-bd53-6220cba91c7b'],
  })
  @IsUUID(4, { each: true, message: 'Each employee ID must be a valid UUID' })
  @ArrayMinSize(1, { message: 'At least one employee ID is required' })
  @IsNotEmpty({ message: 'Employee IDs are required and cannot be empty' })
  employeeIds: string[];

  // --- CYCLIC ---
  @ApiPropertyOptional({ example: '2025-10-11' })
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Start date is required and cannot be empty' })
  startDate: string;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: [],
    description: 'Days of week to repeat (0=Sunday,...6=Saturday)',
    type: [Number],
  })
  @IsOptional()
  repeatDays?: number[];
}

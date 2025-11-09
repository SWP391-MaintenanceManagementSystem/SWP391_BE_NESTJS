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
    example: 'uuid-shift',
  })
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Shift ID is required and cannot be empty' })
  shiftId: string;

  @ApiProperty({
    example: 'uuid-service-center',
  })
  @IsUUID(4, { message: 'Service Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Service Center ID is required and cannot be empty' })
  centerId: string;

  @ApiProperty({
    type: [String],
    example: ['uuid-employee-1', 'uuid-employee-2'],
  })
  @IsUUID(4, { each: true, message: 'Each employee ID must be a valid UUID' })
  @ArrayMinSize(1, { message: 'At least one employee ID is required' })
  @IsNotEmpty({ message: 'Employee IDs are required and cannot be empty' })
  employeeIds: string[];

  // --- CYCLIC ---
  @ApiPropertyOptional({ example: '2025-10-11' })
  @IsDateString({}, { message: 'Start date must be a valid date string' })
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

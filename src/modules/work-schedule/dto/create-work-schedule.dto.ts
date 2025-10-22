import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class CreateWorkScheduleDTO {
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Shift ID is required and cannot be empty' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  shiftId: string;

  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Employee ID is required and cannot be empty' })
  @ApiProperty({
    example: 'c7a72f5e-98ab-40b2-bd53-6220cba91c7a',
  })
  employeeId: string;

  // --- SINGLE ---
  @ApiPropertyOptional({ example: '2025-10-09' })
  @ValidateIf(o => !o.startDate && !o.endDate) // chỉ validate nếu không có start/endDate
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  @IsOptional()
  date?: string;

  // --- CYCLIC ---
  @ApiPropertyOptional({ example: '2025-10-11' })
  @ValidateIf(o => !o.date) // chỉ validate nếu không có date đơn
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-10-17' })
  @ValidateIf(o => !o.date)
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: [1, 3, 5],
    description: 'Days of week to repeat (0=Sunday,...6=Saturday)',
    type: [Number],
  })
  @ValidateIf(o => !o.date)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  repeatDays?: number[];
}

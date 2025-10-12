import { IsString, IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkCenterDTO {
  @IsString({ message: 'Employee ID must be a string' })
  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Employee ID must be provided' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee account UUID',
  })
  employeeId: string;

  @IsString({ message: 'Center ID must be a string' })
  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Center ID must be provided' })
  @ApiProperty({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  centerId: string;

  @IsNotEmpty({ message: 'Start Date must be provided' })
  @IsDateString({}, { message: 'Start Date must be a valid date string' })
  @ApiProperty({
    example: '2025-11-20T08:00:00.000Z',
    description: 'Start date of the work center assignment',
  })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'End Date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2029-11-25T17:00:00.000Z',
    description: 'End date of the work center assignment (optional)',
  })
  endDate: string;
}

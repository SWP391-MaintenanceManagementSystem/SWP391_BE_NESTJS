import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkCenterDto {
  @IsOptional()
  @IsString({ message: 'Employee ID must be a string' })
  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee account UUID',
  })
  employeeId?: string[];

  @IsOptional()
  @IsString({ message: 'Center ID must be a string' })
  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @ApiPropertyOptional({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start Date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-20T08:00:00.000Z',
    description: 'Start date of the work center assignment (optional)',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End Date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-25T08:00:00.000Z',
    description: 'End date of the work center assignment (optional)',
  })
  endDate?: string;
}

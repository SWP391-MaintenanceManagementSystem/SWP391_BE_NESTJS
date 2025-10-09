import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkScheduleDTO {
  @IsOptional()
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Shift UUID',
  })
  shiftId?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee UUID',
  })
  employeeId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid ISO date string' })
  @ApiPropertyOptional({
    example: '2023-10-15',
    description: 'Date for the work schedule (YYYY-MM-DD or ISO format)',
  })
  date?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateCyclicWorkScheduleDTO {
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee account UUID',
  })
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Shift UUID',
  })
  @IsOptional()
  shiftId?: string;

  @ApiPropertyOptional({
    example: '2025-10-11',
    description: 'Start date in YYYY-MM-DD format',
  })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-10-17',
    description: 'End date in YYYY-MM-DD format',
  })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: [1, 3, 5],
    description: 'Days of week to repeat (0=Sunday to 6=Saturday)',
    type: [Number],
  })
  @IsOptional()
  repeatDays?: number[];
}

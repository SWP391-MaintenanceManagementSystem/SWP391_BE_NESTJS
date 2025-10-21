import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
}

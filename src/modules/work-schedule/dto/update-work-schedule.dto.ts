import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkScheduleDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'uuid-shift',
  })
  shiftId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'uuid-employee',
  })
  employeeId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '2025-10-15',
  })
  date?: string;
}

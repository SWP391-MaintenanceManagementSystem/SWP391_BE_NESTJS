import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkScheduleDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  shiftId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'c7a72f5e-98ab-40b2-bd53-6220cba91c7a',
  })
  employeeId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '2025-10-15',
  })
  date?: string;
}

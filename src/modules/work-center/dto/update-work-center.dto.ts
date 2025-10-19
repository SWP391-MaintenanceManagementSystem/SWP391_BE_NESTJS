import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateWorkCenterDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee account UUID',
  })
  employeeId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '2024-01-20T08:00:00.000Z',
    description: 'Start date of the work center assignment (optional)',
  })
  startDate?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  @ApiPropertyOptional({
    example: '2024-01-25T08:00:00.000Z',
    description: 'End date of the work center assignment. Set to current date for soft delete.',
  })
  endDate?: string;
}

import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateWorkCenterDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'uuid-employee',
    description: 'Employee account UUID',
  })
  employeeId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: 'uuid-service-center',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '2024-01-20T08:00',
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
    example: '2024-01-25T08:00',
    description: 'End date of the work center assignment. Set to current date for soft delete.',
  })
  endDate?: string;
}

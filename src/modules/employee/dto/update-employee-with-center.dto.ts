import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateEmployeeWithCenterDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'uuid-service-center',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '2024-01-20T00:00',
    description: 'Start date (optional)',
  })
  startDate?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '',
    description: 'End date of the work center assignment. Set to current date for soft delete.',
  })
  endDate?: string;
}

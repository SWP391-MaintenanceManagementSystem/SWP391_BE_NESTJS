import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateEmployeeWithCenterDTO {
  @IsOptional()
  @ApiPropertyOptional({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @ApiPropertyOptional({
    example: '2024-01-20T08:00:00.000Z',
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

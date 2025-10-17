import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsISO8601 } from 'class-validator';

export class CreateEmployeeWithCenterDTO {
  @IsOptional()
  @IsUUID('4', { message: 'centerId must be a valid UUID (v4)' })
  @ApiPropertyOptional({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'startDate must be a valid ISO 8601 date string' })
  @ApiPropertyOptional({
    example: '2024-01-20T08:00:00.000Z',
    description: 'Start date (optional)',
  })
  startDate?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'endDate must be a valid ISO 8601 date string' })
  @ApiPropertyOptional({
    example: '',
    description: 'End date of the work center assignment. Set to current date for soft delete.',
  })
  endDate?: string;
}

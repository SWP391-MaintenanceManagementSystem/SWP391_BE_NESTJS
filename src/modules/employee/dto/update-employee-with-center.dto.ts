import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEmployeeWithCenterDTO {
  @IsOptional()
  @IsString({ message: 'Center ID must be a string' })
  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @ApiPropertyOptional({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  centerId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Start Date must be a valid date string' })
  @ApiPropertyOptional({
    example: '2024-01-20T08:00:00.000Z',
    description: 'Start date of the work center assignment (optional)',
  })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End Date must be a valid date string' })
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  @ApiPropertyOptional({
    example: '',
    description: 'End date of the work center assignment. Set to current date for soft delete.',
  })
  endDate?: string;
}

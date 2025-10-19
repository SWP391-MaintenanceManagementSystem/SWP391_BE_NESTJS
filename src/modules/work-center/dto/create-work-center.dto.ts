import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateWorkCenterDTO {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Employee account UUID',
  })
  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employeeId: string;

  @ApiProperty({
    example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
    description: 'Service Center UUID',
  })
  @IsUUID(4, { message: 'Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Center ID is required' })
  centerId: string;

  @ApiProperty({
    example: '2025-11-20T08:00:00.000Z',
    description: 'Start date of the work center assignment',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  @ApiPropertyOptional({
    example: '',
    description: 'End date of the work center assignment. Leave empty for permanent assignment.',
  })
  @IsOptional()
  @ValidateIf(obj => obj.endDate !== null && obj.endDate !== undefined && obj.endDate !== '')
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  endDate?: string;
}

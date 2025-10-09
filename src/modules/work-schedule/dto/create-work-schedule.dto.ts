import { IsNotEmpty, IsUUID, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateWorkScheduleDTO {
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Shift ID is required' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Shift UUID',
  })
  shiftId: string;

  @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  @ApiProperty({
    example: 'c7a72f5e-98ab-40b2-bd53-6220cba91c7a',
    description: 'Technician employee UUID to assign',
  })
  employeeId: string;

  @IsDateString(
    {},
    { message: 'Date must be a valid ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)' }
  )
  @Transform(({ value }) => {
    // ✅ Thêm transform để handle date properly
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    return value;
  })
  @ApiProperty({
    example: '2025-10-09T08:00:00.000Z',
    description: 'Date for the work schedule (YYYY-MM-DD or ISO format)',
  })
  date: string;
}

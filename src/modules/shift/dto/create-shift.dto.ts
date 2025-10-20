import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, Matches, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateShiftDTO {
  @ApiProperty({ example: 'Morning Shift' })
  @IsNotEmpty({ message: 'Shift name is required' })
  name: string;

  @ApiProperty({ example: '08:00:00', description: 'Start Time (HH:mm:ss)' })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Start time must be in format HH:mm:ss',
  })
  @IsNotEmpty({ message: 'Start time is required' })
  startTime: string;

  @ApiProperty({ example: '12:00:00', description: 'End Time (HH:mm:ss)' })
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'End time must be in format HH:mm:ss',
  })
  @IsNotEmpty({ message: 'End time is required' })
  endTime: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum booking slots for this shift',
  })
  @Min(1, { message: 'Maximum slot must be at least 1' })
  @Max(50, { message: 'Maximum slot cannot exceed 50' })
  @IsNumber({}, { message: 'Maximum slot must be a number' })
  @IsNotEmpty({ message: 'Maximum slot is required' })
  maximumSlot: number;

  @IsUUID(4, { message: 'Service Center ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Service Center ID is required' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Service center UUID',
  })
  centerId: string;
}

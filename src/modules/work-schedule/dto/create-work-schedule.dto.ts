import { IsNotEmpty, IsUUID, IsArray, ArrayMinSize, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateWorkScheduleDto {
  @IsUUID(4, { message: 'Shift ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Shift ID is required' })
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Shift UUID'
  })
  shiftId: string;

  @IsArray({ message: 'Employee IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one employee ID is required' })
  @IsUUID(4, { each: true, message: 'Each employee ID must be a valid UUID' })
  @ApiProperty({
    example: ['c7a72f5e-98ab-40b2-bd53-6220cba91c7a'],
    description: 'Array of technician employee UUIDs to assign'
  })
  employeeId: string[];

  @IsDateString({}, { message: 'Date must be a valid ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)' })
  @ApiProperty({
    example: '2023-10-15',
    description: 'Date for the work schedule (YYYY-MM-DD or ISO format)'
  })
  date: string;
}

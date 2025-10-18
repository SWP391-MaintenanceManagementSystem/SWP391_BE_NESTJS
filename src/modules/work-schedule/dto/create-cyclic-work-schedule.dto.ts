import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateCyclicWorkScheduleDTO {
  @ApiProperty({ example: 'uuid-of-employee' })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @ApiProperty({ example: 'uuid-of-shift' })
  @IsUUID()
  @IsNotEmpty()
  shiftId: string;

  @ApiProperty({ example: '2025-10-11' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2025-10-17' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ example: [1, 3, 5], description: '0=Sunday → 6=Saturday' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  repeatDays: number[];
}

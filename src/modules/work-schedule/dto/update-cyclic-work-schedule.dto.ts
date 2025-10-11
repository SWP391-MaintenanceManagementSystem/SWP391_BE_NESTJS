import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class UpdateCyclicWorkScheduleDTO {
  @ApiPropertyOptional({ example: 'uuid-of-employee' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-shift' })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ example: '2025-10-11' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-10-17' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: [1, 3, 5], description: '0=Sunday → 6=Saturday' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  repeatDays?: number[];
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '@prisma/client';
import { IsOptional } from 'class-validator';

export class UpdateShiftDTO {
  @ApiPropertyOptional({ example: 'Morning Shift' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '08:00:00', description: 'Start Time (HH:mm:ss)' })
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '12:00:00', description: 'End Time (HH:mm:ss)' })
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 10, description: 'Maximum booking slots for this shift' })
  @IsOptional()
  maximumSlot?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ShiftStatus })
  @IsOptional()
  status?: ShiftStatus;

  @ApiPropertyOptional({ example: 'ServiceCenterId', description: 'Center Id' })
  @IsOptional()
  centerId?: string;
}

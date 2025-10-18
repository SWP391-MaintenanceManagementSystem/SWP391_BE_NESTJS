import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '@prisma/client';
import { IsEnum, IsOptional, Matches, IsString, IsInt, Min } from 'class-validator';

export class UpdateShiftDTO {
  @ApiPropertyOptional({ example: 'Morning Shift' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '08:00:00', description: 'Start Time (HH:mm:ss)' })
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'startTime must be in format HH:mm:ss',
  })
  startTime?: string;

  @ApiPropertyOptional({ example: '12:00:00', description: 'End Time (HH:mm:ss)' })
  @IsOptional()
  @Matches(/^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'endTime must be in format HH:mm:ss',
  })
  endTime?: string;

  @ApiPropertyOptional({ example: 10, description: 'Maximum number of slots for this shift' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maximumSlot?: number;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ example: 'ServiceCenterId', description: 'Center Id' })
  @IsOptional()
  @IsString({ message: 'Center Id must be a string' })
  centerId?: string;
}

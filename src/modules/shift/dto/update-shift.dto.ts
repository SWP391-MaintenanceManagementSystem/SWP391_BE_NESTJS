import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateShiftDto {
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    @ApiPropertyOptional({ example: 'Morning Shift', description: 'Shift name', })
    name?: string;

    @IsOptional()
    @IsString({ message: 'Start time must be a valid date string' })
    @ApiPropertyOptional({ example: '2024-01-01T08:00:00.000Z', description: 'Shift start time', })
    startTime?: string;

    @IsOptional()
    @IsString({ message: 'End time must be a valid date string' })
    @ApiPropertyOptional({ example: '2024-01-01T17:00:00.000Z', description: 'Shift end time', })
    endTime?: string;

    @IsOptional()
    @IsString({ message: 'Start date must be a valid date string' })
    @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z', description: 'Shift start date (optional)', })
    startDate?: string;

    @IsOptional()
    @IsString({ message: 'End date must be a valid date string' })
    @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z', description: 'Shift end date (optional)', })
    endDate?: string;

    @IsOptional()
    @ApiPropertyOptional({ example: 10, description: 'Maximum number of technicians for this shift', })
    maximumSlot?: number;

    @IsOptional()
    @IsString({ message: 'Repeat days must be a string' })
    @Matches(/^[0-6](,[0-6])*$/, {
        message: 'Repeat days must be comma-separated numbers (0-6, where 0=Sunday)'
    })
    @ApiPropertyOptional({
        example: '1,3,5',
        description: 'Days of the week the shift repeats (0=Sunday, 1=Monday, ..., 6=Saturday)'
    })
  repeatDays?: string;
}

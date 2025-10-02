import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkScheduleDto {
    @IsOptional()
    @IsString({ message: 'Shift ID must be a string' })
    @ApiPropertyOptional({
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        description: 'Shift UUID'
    })
    shiftId?: string;

    @IsOptional()
    @IsString({ message: 'Employee ID must be a string' })
    @ApiPropertyOptional({
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        description: 'Employee UUID'
    })
    employeeId?: string[];

    @IsOptional()
    @IsString({ message: 'Date must be a string in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)' })
    @ApiPropertyOptional({
        example: '2023-10-15',
        description: 'Date for the work schedule (YYYY-MM-DD or ISO format)'
    })
    date?: string;
}

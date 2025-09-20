import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVehicleDTO {
    @ApiPropertyOptional({ description: 'New license plate', example: '51H-54321' })
    @IsOptional()
    @IsString()
    @Matches(/^[0-9A-Z\-]{5,10}$/) 
    licensePlate?: string;

    @ApiPropertyOptional({ description: 'Vehicle status', example: 'INACTIVE' })
    @IsOptional()
    status?: 'ACTIVE' | 'INACTIVE';
}

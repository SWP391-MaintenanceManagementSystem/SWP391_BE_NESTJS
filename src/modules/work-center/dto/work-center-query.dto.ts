import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from 'src/common/sort/sort.config';

export class WorkCenterQueryDto {
    @IsOptional()
    @IsString({ message: 'Employee ID must be a string' })
    @IsUUID(4, { message: 'Employee ID must be a valid UUID' })
    @ApiPropertyOptional({
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        description: 'Filter by employee ID'
    })
    employeeId?: string;

    @IsOptional()
    @IsString({ message: 'Center ID must be a string' })
    @IsUUID(4, { message: 'Center ID must be a valid UUID' })
    @ApiPropertyOptional({
        example: 'a1b2c3d4-5678-9abc-def0-123456789abc',
        description: 'Filter by service center ID'
    })
    centerId?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Date from must be a valid date string' })
    @ApiPropertyOptional({
        example: '2024-01-01',
        description: 'Filter assignments from date (YYYY-MM-DD)'
    })
    dateFrom?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Date to must be a valid date string' })
    @ApiPropertyOptional({
        example: '2024-12-31',
        description: 'Filter assignments to date (YYYY-MM-DD)'
    })
    dateTo?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, description: 'Field to sort by', example: 'createdAt' })
    sortBy?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false, description: 'Sort order', example: 'asc' })
    orderBy?: Order;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ required: false, description: 'Filter by page number', example: 1 })
    page?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({ required: false, description: 'Filter by page size', example: 10 })
    pageSize?: number;
}

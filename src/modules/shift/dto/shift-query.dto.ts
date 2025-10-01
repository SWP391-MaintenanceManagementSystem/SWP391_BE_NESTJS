import { ApiProperty } from '@nestjs/swagger';
import { Shift, ShiftStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';

export class ShiftQueryDTO {
    @ApiProperty({ required: false, description: 'Filter by center ID' })
    @IsOptional()
    @IsString()
    centerId?: string;

    @ApiProperty({ required: false, description: 'Filter by shift name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ required: false, description: 'Filter by start time' })
    @IsOptional()
    @Type(() => Date)
    startTime?: Date;

    @ApiProperty({ required: false, description: 'Filter by end time' })
    @IsOptional()
    @Type(() => Date)
    endTime?: Date;

    @ApiProperty({ required: false, description: 'Filter by start date' })
    @IsOptional()
    @Type(() => Date)
    startDate?: Date;

    @ApiProperty({ required: false, description: 'Filter by end date' })
    @IsOptional()
    @Type(() => Date)
    endDate?: Date;

    @ApiProperty({ required: false, description: 'Filter by shift status' })
    @IsOptional()
    @IsEnum(ShiftStatus)
    status?: ShiftStatus;

    @ApiProperty({
    required: false,
    description: 'Filter by repeated days (0=Sunday, 1=Monday, ..., 6=Saturday)',
    example: ['1', '3', '5'],
    type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(day => day.trim());
        }
        return value;
    })
    repeatDays?: string[];

    @ApiProperty({ required: false, description: 'Sort order' })
    @IsOptional()
    orderBy?: Order;

    @ApiProperty({ required: false, description: 'Field to sort by', example: 'createdAt' })
    @IsOptional()
    @IsString()
    sortBy?: keyof Shift;

    @ApiProperty({ required: false, description: 'Filter by page number', example: 1 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number;

    @ApiProperty({ required: false, description: 'Filter by page size', example: 10 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    pageSize?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { Shift, ShiftStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';

export class ShiftQueryDTO {
  @ApiProperty({ required: false, description: 'Filter by shift ID' })
  @IsOptional()
  @IsString()
  id?: string;

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

  @ApiProperty({ required: false, description: 'Filter by shift status', enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiProperty({ required: false, description: 'Field to sort by' })
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

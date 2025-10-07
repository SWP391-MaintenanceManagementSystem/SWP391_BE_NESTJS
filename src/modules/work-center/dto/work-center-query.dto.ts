import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from 'src/common/sort/sort.config';

export class WorkCenterQueryDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({
    required: false,
    description: 'Filter by work center ID',
  })
  id?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  @ApiPropertyOptional({
    required: false,
    description: 'Filter by employee ID',
  })
  employeeId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  @ApiProperty({ required: false, description: 'Filter by center ID' })
  centerId?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false, description: 'Filter by start date' })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ required: false, description: 'Filter by end date' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ required: false, description: 'Field to sort by' })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ required: false, description: 'Sort order' })
  orderBy?: Order;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ required: false, description: 'Filter by page number', example: 1 })
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ required: false, description: 'Filter by page size', example: 10 })
  pageSize?: number;
}

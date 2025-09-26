import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterOptionsDTO<T> {
  @ApiPropertyOptional({ description: 'Filter conditions' })
  @IsOptional()
  @IsObject()
  where?: Partial<Record<keyof T, any>>;


  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: keyof T;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: string;

  @ApiPropertyOptional({ description: 'Sorting criteria' })
  @IsOptional()
  @IsObject()
  orderBy?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Number of records to skip', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of records to take', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

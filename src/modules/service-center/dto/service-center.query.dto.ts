import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CenterStatus } from '@prisma/client';

export class ServiceCenterQueryDTO {
  @ApiPropertyOptional({ required: false, description: 'Service center name' })
  @IsOptional()
  @IsString()
  name?: string;


  @ApiPropertyOptional({ required: false, description: 'Service center address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ required: false, description: 'Service center status', enum:CenterStatus })
  @IsOptional()
  @IsEnum(CenterStatus)
  status?: CenterStatus;

  @ApiPropertyOptional({ required: false, description: 'Sort order example: "createdAt" ', type: String })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ required: false, description: 'Sort order example: "asc" or "desc"', type: String })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  orderBy?: 'asc' | 'desc';

  @ApiPropertyOptional({ required: false, description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ required: false, description: 'Page size', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}

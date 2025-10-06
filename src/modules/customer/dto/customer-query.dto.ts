import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsIn, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '@prisma/client';
import { Order } from 'src/common/sort/sort.config';

export class CustomerQueryDTO {
  @ApiPropertyOptional({ description: 'Customer first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Customer last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Is premium customer?' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPremium?: boolean;

  @ApiPropertyOptional({
    enum: AccountStatus,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Customer email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Sort order example: "createdAt" ', type: String })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order example: "asc" or "desc"', type: String })
  @IsOptional()
  @IsString()
  orderBy?: Order;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}

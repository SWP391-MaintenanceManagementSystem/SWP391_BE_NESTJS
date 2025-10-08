import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsIn } from 'class-validator';
import { CenterStatus } from '@prisma/client';
import { Order } from 'src/common/sort/sort.config';

export class ServiceCenterQueryDTO {
  @ApiPropertyOptional({ description: 'Service center ID' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Service center name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Service center address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Service center status',
    enum: CenterStatus,
  })
  @IsOptional()
  @IsEnum(CenterStatus)
  status?: CenterStatus;

  @ApiPropertyOptional({
    description: 'Sort by field name (e.g. "createdAt")',
    type: String,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  orderBy?: Order;
}

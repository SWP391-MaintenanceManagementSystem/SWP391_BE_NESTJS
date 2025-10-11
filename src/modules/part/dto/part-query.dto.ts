import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';
import { PartStatus } from '@prisma/client'

export class PartQueryDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Search by part name or category name',
  })
  name?: string;

 @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Filter by category name',
  })
  categoryName?: string;


  @IsOptional()
  @IsEnum(PartStatus)
  @ApiProperty({
    required: false,
    description: 'Filter by part status (AVAILABLE, OUT_OF_STOCK, DISCONTINUED)',
    enum: PartStatus,
  })
  status?: PartStatus;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
  })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Sort order (asc or desc)',
    example: 'desc',
  })
  orderBy?: Order;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Number of items per page for pagination',
    example: 10,
  })
  pageSize?: number;
}

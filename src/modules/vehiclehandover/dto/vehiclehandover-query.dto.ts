import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';

export class VehicleHandoverQueryDTO {
  @ApiPropertyOptional({ required: false, description: 'Filter by vehicle handover ID' })
  @IsOptional()
  @IsString()
  id: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Filter by booking ID',
  })
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({ required: false, description: 'Filter by staff ID' })
  @IsOptional()
  staffId?: string;

  @ApiPropertyOptional({ required: false, description: 'Filter by date from' })
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ required: false, description: 'Filter by date to' })
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ required: false, description: 'Filter by Order (asc or desc)' })
  @IsOptional()
  orderBy?: Order;

  @ApiPropertyOptional({ required: false, description: 'Filter by Sort field' })
  @IsOptional()
  sortBy?: string;

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

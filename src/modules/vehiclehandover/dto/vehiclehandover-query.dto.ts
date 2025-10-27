import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { Order } from 'src/common/sort/sort.config';

export class VehicleHandoverQueryDTO {
  @ApiProperty({ required: false, description: 'Filter by vehicle handover ID' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ required: false, description: 'Filter by booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiProperty({ required: false, description: 'Filter by staff ID' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by start date (2025-10-20T00:00)',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by end date (2025-10-27T23:59)',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Field to sort by' })
  sortBy?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Sort order' })
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

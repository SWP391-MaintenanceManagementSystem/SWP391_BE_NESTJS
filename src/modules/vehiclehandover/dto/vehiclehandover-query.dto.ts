import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsUUID, IsDateString, Matches } from 'class-validator';
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
    description: 'Filter by start date (e.g. 2025-10-20T00:00)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom must be a valid ISO 8601 date string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, {
    message: 'dateFrom must be in format YYYY-MM-DDTHH:mm',
  })
  dateFrom?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by end date (e.g. 2025-10-27T23:59)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo must be a valid ISO 8601 date string' })
  @Matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, {
    message: 'dateTo must be in format YYYY-MM-DDTHH:mm',
  })
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

// src/modules/work-schedule/dto/work-schedule-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { AccountRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { Order } from 'src/common/sort/sort.config';

export enum WorkScheduleRoleFilter {
  STAFF = 'STAFF',
  TECHNICIAN = 'TECHNICIAN',
}

export class WorkScheduleQueryDTO {
  @ApiProperty({ required: false, description: 'Filter by work schedule ID' })
  @IsOptional()
  @IsUUID(4)
  id?: string;

  @ApiProperty({ required: false, description: 'Filter by shift ID' })
  @IsOptional()
  @IsUUID(4)
  shiftId?: string;

  @ApiProperty({ required: false, description: 'Filter by employee ID' })
  @IsOptional()
  @IsUUID(4)
  employeeId?: string;

  @ApiProperty({ required: false, description: 'Filter by service center ID' })
  @IsOptional()
  @IsUUID(4)
  centerId?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by employee Role',
    enum: WorkScheduleRoleFilter,
  })
  @IsOptional()
  @IsEnum(WorkScheduleRoleFilter)
  role?: WorkScheduleRoleFilter;

  @ApiProperty({ required: false, description: 'Search by employee name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by date from' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiProperty({ required: false, description: 'Filter by date to' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiProperty({ required: false, description: 'Sort order' })
  @IsOptional()
  orderBy?: Order;

  @ApiProperty({ required: false, description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ required: false, description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ required: false, description: 'Page size', example: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pageSize?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, IsEmail, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountStatus } from '@prisma/client';
import { Order } from 'src/common/sort/sort.config';
import { AccountRole } from '@prisma/client';

export class EmployeeQueryDTO {
  @ApiPropertyOptional({ required: false, description: 'Employee ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ required: false, description: 'Employee first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ required: false, description: 'Employee last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    required: false,
    enum: AccountStatus,
    description: 'Account status',
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ required: false, description: 'Employee email' })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ required: false, description: 'Employee phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ required: false, description: 'Employee role', enum: AccountRole })
  @IsOptional()
  @IsEnum(AccountRole)
  role?: AccountRole;

  @ApiPropertyOptional({ required: false, description: 'Service center ID' })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiPropertyOptional({ required: false, description: 'Service center name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    required: false,
    description:
      'Filter by work center assignment status. true = has work center, false = not assigned',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  hasWorkCenter?: boolean;

  @ApiPropertyOptional({
    required: false,
    description: 'Sort order example: "createdAt" ',
    type: String,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    required: false,
    description: 'Sort order example: "asc"',
    type: String,
  })
  @IsOptional()
  @IsString()
  orderBy?: Order;

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

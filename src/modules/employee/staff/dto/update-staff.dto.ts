import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';

import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateStaffDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @Matches(/^[0-9]{10,11}$/, { message: 'Phone must be 10-11 digits' })
  @ApiPropertyOptional({ example: '0912345678' })
  phone?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  @ApiPropertyOptional({ required: false, example: 'VERIFIED', enum: AccountStatus })
  status?: AccountStatus;
}

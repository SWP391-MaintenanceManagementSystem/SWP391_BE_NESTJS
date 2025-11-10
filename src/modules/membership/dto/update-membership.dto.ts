import { ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipStatus, PeriodType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMembershipDTO {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @ApiPropertyOptional({ description: 'The name of the membership', example: 'Gold Membership' })
  name?: string;

  @IsOptional()
  @ApiPropertyOptional({ description: 'The duration of the membership in months', example: 12 })
  @Type(() => Number)
  duration?: number;

  @IsOptional()
  @IsEnum(PeriodType, { message: 'Period type must be a valid enum value' })
  @ApiPropertyOptional({
    description: 'The period type of the membership',
    example: PeriodType.MONTH,
  })
  periodType?: PeriodType;

  @IsOptional()
  @ApiPropertyOptional({ description: 'The price of the membership', example: 99.99 })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'The description of the membership',
    example: 'Premium membership with additional benefits',
  })
  description?: string;

  @IsOptional()
  @IsEnum(MembershipStatus, { message: 'Status must be a valid enum value' })
  @ApiPropertyOptional({
    description: 'The status of the membership',
    example: MembershipStatus.ACTIVE,
  })
  status?: MembershipStatus;
}

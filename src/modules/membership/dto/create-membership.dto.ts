import { ApiProperty } from '@nestjs/swagger';
import { PeriodType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMembershipDTO {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @ApiProperty({ description: 'The name of the membership', example: 'Gold Membership' })
  name: string;
  @IsNotEmpty({ message: 'Duration is required' })
  @ApiProperty({ description: 'The duration of the membership', example: 30 })
  @Type(() => Number)
  duration: number;

  @IsNotEmpty({ message: 'Period type is required' })
  @ApiProperty({
    description: 'The period type of the membership',
    example: 'DAY',
    enum: PeriodType,
  })
  @IsString({ message: 'Period type must be a string' })
  periodType: PeriodType;
  @IsNotEmpty({ message: 'Price is required' })
  @ApiProperty({ description: 'The price of the membership', example: 99.99 })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @ApiProperty({
    description: 'The description of the membership',
    example: 'This is a gold membership plan.',
  })
  description?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateCustomerDTO {
  @IsOptional({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @Length(1, 30, { message: 'First name must be between 2 and 30 characters long' })
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'First name can only contain letters and spaces',
  })
  @ApiPropertyOptional({
    description: 'The first name of the user',
    example: 'John',
    minLength: 1,
    maxLength: 30,
  })
  firstName?: string;

  @IsOptional({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @Length(1, 30, { message: 'Last name must be between 2 and 30 characters long' })
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'Last name can only contain letters and spaces',
  })
  @ApiPropertyOptional({
    description: 'The last name of the user',
    example: 'Doe',
    minLength: 1,
    maxLength: 30,
  })
  lastName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ required: false, example: '+1234567890' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ required: false, example: '123 Main St, City, Country' })
  address?: string;

  @IsOptional()
  @IsEnum(AccountStatus)
  @ApiPropertyOptional({ required: false, example: 'VERIFIED', enum: AccountStatus })
  status?: AccountStatus;
}

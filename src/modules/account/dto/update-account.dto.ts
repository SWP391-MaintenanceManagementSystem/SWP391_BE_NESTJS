import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, Length, Matches } from 'class-validator';

export class UpdateAccountDTO {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @Length(2, 30, { message: 'First name must be between 2 and 30 characters long' })
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'First name can only contain letters and spaces',
  })
  @ApiPropertyOptional({
    description: 'The first name of the user',
    example: 'John',
    minLength: 2,
    maxLength: 30,
  })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @Length(2, 30, { message: 'Last name must be between 2 and 30 characters long' })
  @Matches(/^[\p{L}\s]+$/u, {
    message: 'Last name can only contain letters and spaces',
  })
  @ApiPropertyOptional({
    description: 'The last name of the user',
    example: 'Doe',
    minLength: 2,
    maxLength: 30,
  })
  lastName: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '123 Main St, City, Country' })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '+1234567890' })
  phone?: string;
}

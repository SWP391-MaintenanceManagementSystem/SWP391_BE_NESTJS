import { IsNotEmpty, IsString, IsOptional, IsEmail, Matches, MinLength, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTechnicianDto {
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @ApiProperty({ example: 'tech@example.com', description: 'Technician email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  @ApiProperty({ 
    example: 'Password123!', 
    description: 'Strong password with uppercase, lowercase, number and special character' 
  })
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @ApiProperty({ example: 'John', description: 'Technician first name' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsOptional()
  @ApiPropertyOptional({ example: 'Doe', description: 'Technician last name' })
  lastName?: string;

  @IsString({ message: 'Phone must be a string' })
  @IsOptional()
  @Matches(/^[0-9]{10,11}$/, { message: 'Phone must be 10-11 digits' })
  @ApiPropertyOptional({ example: '0912345678', description: 'Phone number (10-11 digits)' })
  phone?: string;
}
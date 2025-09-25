import { IsString, IsOptional, IsEmail, Matches, MinLength, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTechnicianDto {
  @IsOptional()
  @IsNotEmpty({ message: 'Email should not be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  @ApiPropertyOptional({ example: 'tech@example.com' })

  email?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'First name should not be empty' })
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
  @IsNotEmpty({ message: 'Password should not be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character'
  })
  @ApiPropertyOptional({ example: 'NewPassword123!' })
  password?: string;
}
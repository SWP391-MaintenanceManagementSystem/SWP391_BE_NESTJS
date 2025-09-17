import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { Expose, Type } from 'class-transformer';

export class SignUpDTO {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @ApiProperty({
    description: 'The email of the user',
    example: 'user@example.com',
    format: 'email',
  })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  @ApiProperty({
    description: 'The password of the user',
    example: 'Password123!',
    minLength: 8,
    maxLength: 50,
  })
  password: string;

  @IsNotEmpty({ message: 'Password confirmation is required' })
  @IsString({ message: 'Password confirmation must be a string' })
  @ApiProperty({
    description: 'The confirmation password of the user',
    example: 'Password123!',
  })
  confirmPassword: string;

  @IsNotEmpty({ message: 'First name is required' })
  @IsString({ message: 'First name must be a string' })
  @Length(2, 30, { message: 'First name must be between 2 and 30 characters long' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'First name can only contain letters, spaces, hyphens and apostrophes',
  })
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
    minLength: 2,
    maxLength: 30,
  })
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString({ message: 'Last name must be a string' })
  @Length(2, 30, { message: 'Last name must be between 2 and 30 characters long' })
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: 'Last name can only contain letters, spaces, hyphens and apostrophes',
  })
  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
    minLength: 2,
    maxLength: 30,
  })
  lastName: string;


  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(?:\+84|0)(3|5|7|8|9)\d{8}$/, {
    message: 'Phone number must be a valid Vietnamese phone number',
  })
  @ApiProperty({
    description: 'The phone number of the user',
    example: '0987654321',
    required: false,
  })
  phone?: string;


  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @Length(5, 100, { message: 'Address must be between 5 and 100 characters long' })
  @ApiProperty({
    description: 'The address of the user',
    example: '123 Main St, Hanoi, Vietnam',
    minLength: 5,
    maxLength: 100,
    required: false,
  })
  address?: string;
}


export class SignUpResponseDTO {
  @Expose()
  @Type(() => AccountWithProfileDTO)
  account: AccountWithProfileDTO;

  @Expose()
  message: string;
}
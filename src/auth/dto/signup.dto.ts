import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class SignUpDTO {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ description: 'The email of the user', example: 'user@example.com' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The password of the user', example: 'password123' })
  password: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The confirmation password of the user', example: 'password123' })
  confirmPassword: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The first name of the user', example: 'John' })
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'The last name of the user', example: 'Doe' })
  lastName: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetDefaultPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}

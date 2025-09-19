import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
export class SignInDTO {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @ApiProperty({ description: 'The email of the user', example: 'user@example.com' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @ApiProperty({ description: 'The password of the user', example: 'password123' })
  password: string;
}

export class SignInResponseDTO {
  @Expose()
  @Type(() => AccountWithProfileDTO)
  account: AccountWithProfileDTO;


  @Expose()
  accessToken: string;

  @Expose()
  message: string;
}

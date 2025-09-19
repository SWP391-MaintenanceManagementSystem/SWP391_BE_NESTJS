import { AccountRole } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateAccountDTO {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  role?: AccountRole;

}

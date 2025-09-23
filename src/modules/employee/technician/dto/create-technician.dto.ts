import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateTechnicianDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}

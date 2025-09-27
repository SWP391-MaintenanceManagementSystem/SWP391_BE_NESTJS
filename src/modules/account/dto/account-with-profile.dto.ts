import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';
import { Expose, Exclude, Transform } from 'class-transformer';
import { AccountStatus, AuthProvider, AccountRole } from '@prisma/client';
import { CustomerDTO } from 'src/modules/customer/dto/customer.dto';
import { EmployeeDTO } from 'src/modules/employee/dto/employee.dto';

export type Profile = CustomerDTO | EmployeeDTO;

export class AccountWithProfileDTO {
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;

  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;

  @IsString()
  @IsOptional()
  @Exclude()
  password?: string | null;

  @IsNotEmpty()
  @Expose()
  role: AccountRole;

  @IsOptional()
  @Expose()
  phone?: string | null;

  @IsOptional()
  @Expose()
  address?: string | null;

  @IsOptional()
  @Expose()
  avatar?: string | null;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;

  @Expose()
  status: AccountStatus;

  @Exclude()
  provider: AuthProvider[];

  @Expose()
  profile: Profile | null;
}

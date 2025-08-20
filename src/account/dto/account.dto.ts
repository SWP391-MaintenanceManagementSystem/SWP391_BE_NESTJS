import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';
import { Expose, Exclude, Transform } from 'class-transformer';
import { Account, AuthProvider, Role } from '@prisma/client';

export class AccountDTO {
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  lastName: string;

  @IsString()
  @IsOptional()
  @Exclude()
  password: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  accountId: string;

  @IsNotEmpty()
  @Expose()
  role: Role;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;

  @Expose()
  isVerified: boolean;
  @Expose()
  isBanned: boolean;

  @Exclude()
  provider: AuthProvider[]

  constructor(partial: Partial<Account>) {
    Object.assign(this, partial);
  }
}

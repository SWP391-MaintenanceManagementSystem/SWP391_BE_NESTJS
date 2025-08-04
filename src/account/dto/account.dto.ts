import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { Expose, Exclude, Transform } from 'class-transformer';
import { Account, Role } from '@prisma/client';

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

  @IsNotEmpty()
  @IsString()
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
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;

  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => value.toISOString())
  updatedAt: Date;

  @Expose()
  isVerified: boolean;
  @Expose()
  isBanned: boolean;
  @Expose()
  isGoogle: boolean;

  constructor(partial: Partial<Account>) {
    Object.assign(this, partial);
  }
}

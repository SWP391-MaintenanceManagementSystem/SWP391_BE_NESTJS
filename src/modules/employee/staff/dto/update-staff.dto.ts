import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountStatus } from '@prisma/client';

import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateStaffDto {
 @IsOptional({ message: 'First name is required' })
   @IsString({ message: 'First name must be a string' })
   @Length(2, 30, { message: 'First name must be between 2 and 30 characters long' })
   @Matches(/^[A-Za-zÀ-ỹ0-9_\s]+$/, {
     message: 'First name can only contain letters and spaces',
   })
   @ApiPropertyOptional({
     description: 'The first name of the user',
     example: 'John',
     minLength: 1,
     maxLength: 30,
   })
   firstName?: string;

   @IsOptional({ message: 'Last name is required' })
   @IsString({ message: 'Last name must be a string' })
   @Length(2, 30, { message: 'Last name must be between 2 and 30 characters long' })
   @Matches(/^[A-Za-zÀ-ỹ0-9_\s]+$/, {
     message: 'Last name can only contain letters and spaces',
   })
   @ApiPropertyOptional({
     description: 'The last name of the user',
     example: 'Doe',
     minLength: 1,
     maxLength: 30,
   })
   lastName?: string;

   @IsOptional()
   @IsString({ message: 'Phone must be a string' })
   @Matches(/^[0-9]{10,11}$/, { message: 'Phone must be 10-11 digits' })
   @ApiPropertyOptional({ example: '0912345678' })
   phone?: string;

   @IsOptional()
   @IsEnum(AccountStatus)
   @ApiPropertyOptional({ required: false, example: 'VERIFIED', enum: AccountStatus })
   status?: AccountStatus;
}

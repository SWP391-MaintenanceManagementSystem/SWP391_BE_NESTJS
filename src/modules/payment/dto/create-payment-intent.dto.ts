import { ApiProperty } from '@nestjs/swagger';
import { ReferenceType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreatePaymentIntentDTO {
  @IsNotEmpty({ message: 'Reference ID is required' })
  @IsString({ message: 'Reference ID must be a string' })
  @ApiProperty({
    description: 'The ID of the reference for the payment',
    example: 'sub_1234567890',
  })
  referenceId: string;

  @IsNotEmpty({ message: 'Reference type is required' })
  @IsEnum(ReferenceType)
  @ApiProperty({
    description: 'The type of reference for the payment',
    example: ReferenceType.MEMBERSHIP,
    enum: ReferenceType,
  })
  referenceType: ReferenceType;

  @IsNotEmpty({ message: 'Amount is required' })
  @ApiProperty({ description: 'The amount to be charged', example: 1000 })
  @Type(() => Number)
  amount: number;
}

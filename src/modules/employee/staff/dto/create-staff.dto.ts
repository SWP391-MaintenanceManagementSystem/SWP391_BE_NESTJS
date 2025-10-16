import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateCertificateDTO } from '../../certificate/dto/create-certificate.dto';
import { Type } from 'class-transformer';
export class CreateStaffDTO {
  @ApiProperty({
    example: 'Nguyen',
    description: 'First name of the staff',
  })
  @IsNotEmpty({ message: 'First name must not be empty' })
  @IsString({ message: 'First name must be a string' })
  @Matches(/^[A-Za-zÀ-ỹ0-9_\s]+$/, {
    message: 'First name can only contain letters and spaces',
  })
  firstName: string;

  @ApiProperty({
    example: 'Van A',
    description: 'Last name of the staff',
  })
  @IsNotEmpty({ message: 'Last name must not be empty' })
  @IsString({ message: 'Last name must be a string' })
  @Matches(/^[A-Za-zÀ-ỹ0-9_\s]+$/, {
    message: 'Last name can only contain letters and spaces',
  })
  lastName: string;

  @ApiProperty({
    example: 'vana@example.com',
    description: 'Email used for login',
  })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @IsEmail({}, { message: 'Email is not in a valid format' })
  email: string;

  @ApiPropertyOptional({
    example: '+84987654321',
    description: 'Phone number of the staff (optional)',
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(?:\+84|0)(?:\d{9})$/, {
    message: 'Phone number is invalid. It must start with +84 or 0 and contain 10 digits',
  })
  phone?: string;

  @ApiPropertyOptional({
    type: [CreateCertificateDTO],
    description: 'List of certificates belonging to the staff (optional)',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCertificateDTO)
  certificates?: CreateCertificateDTO[];
}

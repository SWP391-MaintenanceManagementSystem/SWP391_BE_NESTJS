import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDTO {
  @IsString()
  @ApiPropertyOptional({ example: 'Certified Electrician' })
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @IsNotEmpty()
  issuedAt: Date;

  @IsDateString()
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  @IsNotEmpty()
  expiresAt: Date;
}

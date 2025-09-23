import { IsString, IsOptional, IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateCertificateDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Certified Electrician' })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '2023-01-01T00:00:00.000Z' })
  issuedAt?: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  expiresAt?: Date;
}

export class UpdateCertificatesDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateCertificateDto)
  @ApiPropertyOptional({ type: [UpdateCertificateDto] })
  certificates?: UpdateCertificateDto[];
}

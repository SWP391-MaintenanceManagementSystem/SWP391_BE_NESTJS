import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CertificateDTO {
  @Expose()
  @ApiProperty({ example: 'cert-12345' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Certified Electrician' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'emp-67890' })
  employeeId: string;

  @Expose()
  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  issuedAt: Date;

  @Expose()
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  expiresAt: Date;
}

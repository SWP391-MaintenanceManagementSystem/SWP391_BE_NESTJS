import { Expose, Transform } from 'class-transformer';
import { CertificateDTO } from '../../certificate/dto/certificate.dto';

export class TechnicianDTO {
  @Expose()
  accountId: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;
  
  @Expose()
  phone?: string;

  @Expose()
  certificates?: CertificateDTO[];

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;
}

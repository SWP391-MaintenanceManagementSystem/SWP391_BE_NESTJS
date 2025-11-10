import { Exclude, Expose, Transform } from 'class-transformer';
import { CertificateDTO } from '../certificate/dto/certificate.dto';

export class EmployeeDTO {
  @Exclude()
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
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}

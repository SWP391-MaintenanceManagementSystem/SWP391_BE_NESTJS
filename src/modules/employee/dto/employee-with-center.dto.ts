import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateDTO } from '../certificate/dto/certificate.dto';

export class WorkCenterDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class EmployeeWithCenterDTO extends AccountWithProfileDTO {
  @Expose()
  @Type(() => WorkCenterDTO)
  workCenters: WorkCenterDTO[];

  @ApiProperty({ type: () => [CertificateDTO] })
  @Expose()
  @Type(() => CertificateDTO)
  certificates: CertificateDTO[];
}

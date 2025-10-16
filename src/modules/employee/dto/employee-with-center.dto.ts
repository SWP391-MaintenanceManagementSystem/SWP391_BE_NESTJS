import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateDTO } from '../certificate/dto/certificate.dto';
import { EmployeeDTO } from './employee.dto';

export class WorkCenterDTO {
  @Expose()
  id: string | null;

  @Expose()
  name: string;

  @Expose()
  startDate?: Date;

  @Expose()
  endDate?: Date | null;
}

export class EmployeeProfileDTO extends EmployeeDTO {
  @ApiProperty({ type: () => [CertificateDTO] })
  @Expose()
  @Type(() => CertificateDTO)
  certificates: CertificateDTO[];
}

export class EmployeeWithCenterDTO extends AccountWithProfileDTO {
  @Expose()
  @Type(() => EmployeeProfileDTO)
  profile: EmployeeProfileDTO | null;

  @Expose()
  @Type(() => WorkCenterDTO)
  workCenter: WorkCenterDTO | null;
}

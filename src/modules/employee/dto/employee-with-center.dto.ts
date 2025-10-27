import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { Expose, Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CertificateDTO } from '../certificate/dto/certificate.dto';
import { EmployeeDTO } from './employee.dto';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns/format';
import { VN_DATE_TIME_FORMAT, VN_TIMEZONE } from 'src/common/constants';

export class WorkCenterDTO {
  @Expose()
  id: string | null;

  @Expose()
  name: string;

  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const localDate = toZonedTime(date, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  startDate: string | null;

  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    const localDate = toZonedTime(date, VN_TIMEZONE);
    return format(localDate, VN_DATE_TIME_FORMAT);
  })
  endDate?: string | null;
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

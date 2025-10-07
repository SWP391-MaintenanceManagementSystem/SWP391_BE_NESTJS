import { AccountWithProfileDTO } from 'src/modules/account/dto/account-with-profile.dto';
import { Expose, Type } from 'class-transformer';

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
}

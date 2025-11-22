import { Expose } from 'class-transformer';

export class EmployeeInfoDTO {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  phoneNumber?: string;

  @Expose()
  avatar?: string;

  @Expose()
  role: string;

  @Expose()
  firstName?: string;
  @Expose()
  lastName?: string;
}

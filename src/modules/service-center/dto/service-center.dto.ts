import { Expose, Transform } from 'class-transformer';

export class ServiceCenterDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  address: string;

  @Expose()
  status: string;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toPlainOnly: true })
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value.toISOString(), { toPlainOnly: true })
  updatedAt: Date;

}

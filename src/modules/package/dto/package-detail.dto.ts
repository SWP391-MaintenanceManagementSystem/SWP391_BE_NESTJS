import { Expose, Transform, Type } from 'class-transformer';

class Services {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  price: number;
}

export class PackageDetailDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;

  @Expose()
  @Type(() => Services)
  services: Services[];
}

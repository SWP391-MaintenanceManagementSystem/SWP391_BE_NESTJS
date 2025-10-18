import { Expose, Transform } from 'class-transformer';

export class BookingDetailDTO {
  @Expose()
  id: string;
  @Expose()
  serviceId?: string;
  @Expose()
  packageId?: string;
  @Expose()
  quantity: number;
  @Expose()
  unitPrice: number;
  @Expose()
  status: string;
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;
  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;
}

import { MembershipStatus, PeriodType } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export class MembershipDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  duration: number;

  @Expose()
  periodType: PeriodType;

  @Expose()
  price: number;

  @Expose()
  description?: string;

  @Expose()
  status: MembershipStatus;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;
}

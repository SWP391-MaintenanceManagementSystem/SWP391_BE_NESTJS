import { ShiftStatus } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export default class ShiftDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  startTime: string;

  @Expose()
  endTime: string;

  @Expose()
  maximumSlot?: number;

  @Expose()
  status: ShiftStatus;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;

  @Expose()
  @Transform(({ value }) =>
    value
      ? {
          id: value.id,
          name: value.name,
          address: value.address,
          status: value.status,
          createdAt:
            value.createdAt instanceof Date ? value.createdAt.toISOString() : value.createdAt,
          updatedAt:
            value.updatedAt instanceof Date ? value.updatedAt.toISOString() : value.updatedAt,
        }
      : undefined
  )
  serviceCenter?: {
    id: string;
    name: string;
    address: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

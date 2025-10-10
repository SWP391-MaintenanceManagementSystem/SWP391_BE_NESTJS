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
  centerId: string;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    const serviceCenter = obj.serviceCenter;
    if (!serviceCenter) return undefined;

    return {
      id: serviceCenter.id,
      name: serviceCenter.name,
      address: serviceCenter.address,
      status: serviceCenter.status,
    };
  })
  serviceCenter?: {
    id: string;
    name: string;
    address: string;
    status: string;
  };
}

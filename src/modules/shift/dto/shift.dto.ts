import { ShiftStatus } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';

export default class ShiftDTO {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  startTime: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  endTime: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  startDate?: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  endDate?: Date;

  @Expose()
  maximumSlot?: number;

  @Expose()
  status: ShiftStatus;

  @Expose()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  })
  repeatDays?: number[]; // Array of numbers (0=Sunday, 1=Monday, ..., 6=Saturday)

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

  @Expose()
  @Transform(({ obj }) => ({
    workSchedules: obj._count?.workSchedules || 0,
  }))
  _count?: {
    workSchedules: number;
  };
}

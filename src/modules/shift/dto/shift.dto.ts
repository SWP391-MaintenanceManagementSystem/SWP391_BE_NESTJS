import { ShiftStatus } from '@prisma/client';
import { Expose, Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ServiceCenterDto } from 'src/modules/service-center/dto/service-center.dto';
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

  @IsString()
  @IsNotEmpty()
  @Expose()
  status: ShiftStatus;

  @Expose()
  @Transform(({ value }) => {
    // Transform database string to array for frontend
    if (typeof value === 'string' && value) {
      return value.split(',').map(day => day.trim());
    }
    return value || [];
  })
  repeatDays?: string[]; // Array for frontend (e.g., ['1', '3', '5'])


  @Expose()
  centerId: string;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updatedAt: Date;

  @Expose()
  serviceCenter?: ServiceCenterDto;

  @Expose()
  _count?: {
    workSchedules: number;
  };
}

import { VehicleStatus } from '@prisma/client';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class VehicleDTO {
  @IsString()
  @Expose()
  id: string;

  @IsString()
  @Expose()
  vin: string;

  @IsString()
  @Expose()
  licensePlate: string;

  @IsString()
  @Expose()
  model: string;

  @IsNumber()
  @Expose()
  productionYear: number;

  @IsString()
  @Expose()
  brand: string;

  @IsString()
  @Expose()
  status: VehicleStatus;

  @IsString()
  @Exclude()
  customerId: string;

  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  lastService?: Date | null;

  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  deletedAt?: Date | null;

  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  createdAt: Date;

  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  @Expose()
  updatedAt: Date;
}
